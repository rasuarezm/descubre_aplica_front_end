import apiClient, { ApiError } from '@/lib/api-client';

export type GenerationKind = 'wbs' | 'observations';

/** Igual que AI_GENERATION_LEASE_SECONDS del backend: pasado este plazo sin progreso, acepta otra generación. */
export const AI_GENERATION_LEASE_MS = 2100 * 1000;
export const GENERATION_POLL_MS = 20_000;
/** Lecturas fallidas seguidas que se toleran antes de avisar que no se conoce el estado. */
const MAX_FAILED_CHECKS = 3;

const DEFAULT_FAILURE_MESSAGE = 'Error en la generación. Por favor, intente de nuevo.';
const NOT_STARTED_MESSAGE = 'El servidor no registró la generación. Puede reintentarla.';
const STALLED_MESSAGE = 'La generación dejó de avanzar y el servidor la dio por terminada. Puede reintentarla.';

export type ServerGeneration =
  | { phase: 'running'; progress: number; step: string }
  | { phase: 'completed' }
  | { phase: 'failed'; error: string }
  | { phase: 'stalled' }
  | { phase: 'idle' };

/**
 * Lo que puede hacer el usuario. `unconfirmed` no permite generar: la primera solicitud pudo
 * encolarse y solo el servidor lo sabe. `retryable` existe solo si el servidor ya respondió.
 */
export type GenerationView =
  | { status: 'idle' }
  | { status: 'running'; progress: { progress: number; step: string } | null }
  | { status: 'unconfirmed' }
  | { status: 'retryable'; message: string };

type GenerationDoc = Record<string, unknown>;

/** `request_id` identifica la acción del usuario: el mismo valor es un reintento, no otra generación. */
export type GenerationRequest<P> = P & { request_id: string };

function updatedAtMs(value: unknown): number | null {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/** Interpreta el documento de la oportunidad, venga del listener (Timestamp) o de la API (texto). */
export function readServerGeneration(
  doc: GenerationDoc,
  kind: GenerationKind,
  now: number,
): ServerGeneration {
  const status = doc[`${kind}_generation_status`];
  if (status === 'queued' || status === 'processing') {
    const updatedAt = updatedAtMs(doc[`${kind}_generation_updated_at`]);
    // Mismo criterio que _generation_in_flight: sin fecha o sin progreso, ya no está en curso.
    if (updatedAt === null || now - updatedAt >= AI_GENERATION_LEASE_MS) return { phase: 'stalled' };
    const progress = doc[`${kind}_generation_progress`];
    const step = doc[`${kind}_generation_step`];
    return {
      phase: 'running',
      progress: typeof progress === 'number' ? progress : 0,
      step: typeof step === 'string' ? step : 'Procesando...',
    };
  }
  if (status === 'completed') return { phase: 'completed' };
  if (status === 'failed') {
    const error = doc[`${kind}_generation_error`];
    return { phase: 'failed', error: typeof error === 'string' && error ? error : DEFAULT_FAILURE_MESSAGE };
  }
  return { phase: 'idle' };
}

export async function fetchOpportunityDoc(opportunityId: string): Promise<GenerationDoc> {
  const data = await apiClient.get<GenerationDoc[]>(`/get_opportunities?opportunity_id=${opportunityId}`);
  if (!Array.isArray(data) || data.length === 0) throw new Error('Oportunidad no encontrada.');
  return data[0];
}

export interface GenerationHandlers {
  /** `confirmed` es false si el resultado se halló al reconciliar y puede ser de una generación anterior. */
  onCompleted: (result: { confirmed: boolean }) => void;
  onFailed: (message: string) => void;
  onRejected: (message: string) => void;
  onInProgress: () => void;
  onAlreadyExists: () => void;
}

interface GenerationTrackerOptions<P> {
  kind: GenerationKind;
  opportunityId: string;
  post: (request: GenerationRequest<P>) => Promise<unknown>;
  subscribe: (onDoc: (doc: GenerationDoc) => void, onError: (error: unknown) => void) => () => void;
  handlers: GenerationHandlers;
  onView: (view: GenerationView) => void;
  fetchDoc?: (opportunityId: string) => Promise<GenerationDoc>;
  now?: () => number;
  pollMs?: number;
}

export interface GenerationTracker<P> {
  start: (payload: P) => Promise<void>;
  /** Repite la última solicitud con el mismo `request_id`. Solo actúa si el servidor confirmó que no hay otra en curso. */
  retry: () => Promise<void>;
  /** Consulta el servidor ahora. */
  check: () => Promise<void>;
  /** Retoma tras recargar o volver a la pestaña, sin solicitud propia. */
  resume: () => Promise<void>;
  /** Descarta un aviso de reintento y vuelve a la vista inicial. */
  dismiss: () => void;
  dispose: () => void;
}

export function createGenerationTracker<P>(options: GenerationTrackerOptions<P>): GenerationTracker<P> {
  const { kind, opportunityId, post, subscribe, handlers, onView } = options;
  const fetchDoc = options.fetchDoc ?? fetchOpportunityDoc;
  const now = options.now ?? Date.now;
  const pollMs = options.pollMs ?? GENERATION_POLL_MS;

  let view: GenerationView = { status: 'idle' };
  let lastRequest: GenerationRequest<P> | null = null;
  let unsubscribe: (() => void) | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let failedChecks = 0;
  // Sin confirmación del servidor, el resultado de una lectura puede ser de una generación anterior.
  let confirmedStart = false;
  let serverSeenRunning = false;
  let disposed = false;

  const setView = (next: GenerationView) => {
    view = next;
    if (!disposed) onView(next);
  };

  const stopWatching = () => {
    unsubscribe?.();
    unsubscribe = null;
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  };

  const settle = (next: GenerationView) => {
    stopWatching();
    failedChecks = 0;
    setView(next);
  };

  const offerRetry = (message: string) => {
    settle(lastRequest === null ? { status: 'idle' } : { status: 'retryable', message });
  };

  const apply = (server: ServerGeneration) => {
    if (view.status === 'idle' || view.status === 'retryable') return;
    switch (server.phase) {
      case 'running':
        serverSeenRunning = true;
        watch();
        setView({ status: 'running', progress: { progress: server.progress, step: server.step } });
        return;
      case 'completed': {
        const confirmed = confirmedStart || serverSeenRunning;
        lastRequest = null;
        settle({ status: 'idle' });
        handlers.onCompleted({ confirmed });
        return;
      }
      case 'failed':
        offerRetry(server.error);
        handlers.onFailed(server.error);
        return;
      case 'stalled':
        offerRetry(STALLED_MESSAGE);
        if (lastRequest === null) handlers.onFailed(STALLED_MESSAGE);
        return;
      case 'idle':
        offerRetry(NOT_STARTED_MESSAGE);
    }
  };

  const check = async () => {
    if (disposed || view.status === 'idle' || view.status === 'retryable') return;
    try {
      const doc = await fetchDoc(opportunityId);
      failedChecks = 0;
      apply(readServerGeneration(doc, kind, now()));
    } catch (error) {
      console.warn(`[ai-generation:${kind}] No se pudo leer el estado:`, error);
      failedChecks += 1;
      if (view.status !== 'running' && view.status !== 'unconfirmed') return;
      watch();
      const tolerated = (confirmedStart || serverSeenRunning) && failedChecks < MAX_FAILED_CHECKS;
      if (!tolerated) setView({ status: 'unconfirmed' });
    }
  };

  /** El listener da el progreso; el sondeo cubre lo que el listener calla (sin red, permiso denegado). */
  function watch() {
    if (disposed) return;
    if (!unsubscribe) {
      unsubscribe = subscribe(
        (doc) => apply(readServerGeneration(doc, kind, now())),
        (error) => {
          console.warn(`[ai-generation:${kind}] Listener con error:`, error);
          unsubscribe = null;
          void check();
        },
      );
    }
    if (!pollTimer) pollTimer = setInterval(() => void check(), pollMs);
  }

  const send = async (request: GenerationRequest<P>) => {
    lastRequest = request;
    confirmedStart = false;
    serverSeenRunning = false;
    failedChecks = 0;
    setView({ status: 'running', progress: null });
    try {
      const response = await post(request);
      // Con este request_id la petición ya terminó: no hay nada nuevo que escuchar.
      if ((response as { status?: string } | undefined)?.status === 'completed') {
        lastRequest = null;
        settle({ status: 'idle' });
        handlers.onCompleted({ confirmed: true });
        return;
      }
      confirmedStart = true;
      watch();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const reason = (error.data as { reason?: string } | null)?.reason;
        if (reason === 'in_progress') {
          confirmedStart = true;
          watch();
          handlers.onInProgress();
        } else {
          lastRequest = null;
          settle({ status: 'idle' });
          handlers.onAlreadyExists();
        }
        return;
      }
      // Un 4xx es un rechazo: no se encoló nada. Un 5xx o la red no dicen si se encoló.
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        lastRequest = null;
        settle({ status: 'idle' });
        handlers.onRejected(error.message);
        return;
      }
      await check();
    }
  };

  return {
    start: (payload) => send({ ...payload, request_id: crypto.randomUUID() }),
    check,
    retry: async () => {
      if (view.status === 'retryable' && lastRequest !== null) await send(lastRequest);
    },
    resume: async () => {
      if (view.status !== 'idle') return;
      setView({ status: 'running', progress: null });
      await check();
    },
    dismiss: () => {
      if (view.status !== 'retryable') return;
      lastRequest = null;
      setView({ status: 'idle' });
    },
    dispose: () => {
      stopWatching();
      disposed = true;
    },
  };
}
