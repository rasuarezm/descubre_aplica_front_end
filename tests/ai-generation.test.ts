import assert from 'node:assert/strict';
import { afterEach, before, beforeEach, describe, it } from 'node:test';
import type { GenerationKind, GenerationTracker, GenerationView } from '@/lib/ai-generation';

// api-client y firebase leen estas variables al importarse; los valores son ficticios.
process.env.NEXT_PUBLIC_API_BASE_URL = '/api-proxy';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app';

const NOW = Date.parse('2026-11-06T15:00:00Z');
const RECENT = new Date(NOW - 60_000).toUTCString();
const EXPIRED = new Date(NOW - 2101 * 1000).toUTCString();
const PAYLOAD = { opportunity_id: 'opportunity-a', document_ids: ['doc-1'] };

type PostResponse = { status: number; body?: unknown } | 'network-down';

let postResponse: PostResponse;
let serverDoc: Record<string, unknown> | 'network-down';
let posts: unknown[];
let reads: number;

/** Backend falso: responde como el gateway y registra lo que hace el código real. */
const interceptedFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const url = String(input);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

  if (url.includes('/get_opportunities')) {
    reads += 1;
    if (serverDoc === 'network-down') throw new TypeError('Failed to fetch');
    return json([serverDoc]);
  }
  posts.push(JSON.parse(String(init.body)));
  if (postResponse === 'network-down') throw new TypeError('Failed to fetch');
  return json(postResponse.body ?? {}, postResponse.status);
};

let generation: typeof import('@/lib/ai-generation');
let apiClient: typeof import('@/lib/api-client').default;

interface Harness {
  tracker: GenerationTracker<typeof PAYLOAD>;
  views: GenerationView[];
  events: string[];
  emit: (doc: Record<string, unknown>) => void;
  failListener: () => void;
  isListening: () => boolean;
}

const trackers: Harness[] = [];

function harness(kind: GenerationKind = 'wbs', pollMs = 60_000): Harness {
  const views: GenerationView[] = [];
  const events: string[] = [];
  let onDoc: ((doc: Record<string, unknown>) => void) | null = null;
  let onError: ((error: unknown) => void) | null = null;

  const tracker = generation.createGenerationTracker<typeof PAYLOAD>({
    kind,
    opportunityId: 'opportunity-a',
    post: (request) => apiClient.post(`/generate_${kind}`, request),
    subscribe: (doc, error) => {
      onDoc = doc;
      onError = error;
      return () => {
        onDoc = null;
        onError = null;
      };
    },
    handlers: {
      onCompleted: ({ confirmed }) => events.push(`completed:${confirmed}`),
      onFailed: (message) => events.push(`failed:${message}`),
      onRejected: (message) => events.push(`rejected:${message}`),
      onInProgress: () => events.push('in-progress'),
      onAlreadyExists: () => events.push('already-exists'),
    },
    onView: (view) => views.push(view),
    now: () => NOW,
    pollMs,
  });

  const created: Harness = {
    tracker,
    views,
    events,
    emit: (doc) => onDoc?.(doc),
    failListener: () => onError?.(new Error('permission-denied')),
    isListening: () => onDoc !== null,
  };
  trackers.push(created);
  return created;
}

const lastView = (h: Harness) => h.views.at(-1);
const processing = { wbs_generation_status: 'processing', wbs_generation_updated_at: RECENT, wbs_generation_progress: 40, wbs_generation_step: 'Analizando' };

before(async () => {
  const { auth } = await import('@/lib/firebase');
  Object.defineProperty(auth, 'currentUser', { value: { getIdToken: async () => 'test-token' } });
  globalThis.fetch = interceptedFetch as typeof fetch;
  generation = await import('@/lib/ai-generation');
  apiClient = (await import('@/lib/api-client')).default;
});

afterEach(() => {
  while (trackers.length) trackers.pop()?.tracker.dispose();
});

beforeEach(() => {
  postResponse = { status: 202, body: { status: 'queued' } };
  serverDoc = {};
  posts = [];
  reads = 0;
});

describe('R3: request_id identifica la acción del usuario', () => {
  const requestIds = () => (posts as { request_id?: string }[]).map((post) => post.request_id);

  it('cada solicitud lleva los datos y un request_id con el formato del contrato', async () => {
    const h = harness('observations');

    await h.tracker.start(PAYLOAD);

    assert.match(requestIds()[0] ?? '', /^[A-Za-z0-9_-]{8,64}$/);
    assert.deepEqual(posts[0], { ...PAYLOAD, request_id: requestIds()[0] });
  });

  it('todos los reintentos de una acción repiten el mismo valor', async () => {
    const h = harness('observations');
    postResponse = { status: 500 };
    await h.tracker.start(PAYLOAD);
    await h.tracker.retry();
    postResponse = { status: 202 };
    await h.tracker.retry();

    assert.equal(posts.length, 3);
    assert.equal(new Set(requestIds()).size, 1);
  });

  it('un clic nuevo lleva otro valor, también después de un fallo', async () => {
    const h = harness('observations');
    postResponse = { status: 500 };
    await h.tracker.start(PAYLOAD);
    h.tracker.dismiss();

    postResponse = { status: 202 };
    await h.tracker.start(PAYLOAD);

    assert.equal(new Set(requestIds()).size, 2);
  });

  it('200 completed: esa petición ya terminó y se refrescan los resultados sin escuchar', async () => {
    const h = harness('observations');
    postResponse = { status: 500 };
    await h.tracker.start(PAYLOAD);

    postResponse = { status: 200, body: { status: 'completed', operation_id: 'op-1' } };
    await h.tracker.retry();

    assert.deepEqual(h.events, ['completed:true']);
    assert.deepEqual(lastView(h), { status: 'idle' });
    assert.equal(h.isListening(), false);
  });

  it('un backend anterior responde sin status y se sigue el listener como antes', async () => {
    const h = harness('observations');
    postResponse = { status: 202, body: {} };

    await h.tracker.start(PAYLOAD);

    assert.equal(h.isListening(), true);
    assert.deepEqual(h.events, []);
  });
});

describe('B11: un 500 o la red no dejan la generación colgada', () => {
  it('500 sin nada en el servidor: ofrece reintento y no repite la solicitud por su cuenta', async () => {
    const h = harness();
    postResponse = { status: 500, body: { error: 'Error interno.' } };

    await h.tracker.start(PAYLOAD);

    assert.equal(lastView(h)?.status, 'retryable');
    assert.equal(posts.length, 1);
    assert.equal(h.isListening(), false);
  });

  it('el reintento repite la misma solicitud una sola vez', async () => {
    const h = harness();
    postResponse = { status: 500 };
    await h.tracker.start(PAYLOAD);

    postResponse = { status: 202 };
    await h.tracker.retry();

    assert.equal(posts.length, 2);
    assert.deepEqual(posts[1], posts[0]);
    assert.equal(lastView(h)?.status, 'running');
    assert.equal(h.isListening(), true);
  });

  it('500 pero la primera sí se encoló: sigue esa generación y no habilita otra', async () => {
    const h = harness();
    postResponse = { status: 500 };
    serverDoc = processing;

    await h.tracker.start(PAYLOAD);

    assert.deepEqual(lastView(h), { status: 'running', progress: { progress: 40, step: 'Analizando' } });
    await h.tracker.retry();
    assert.equal(posts.length, 1);

    h.emit({ wbs_generation_status: 'completed' });
    assert.deepEqual(h.events, ['completed:true']);
    assert.deepEqual(lastView(h), { status: 'idle' });
  });

  it('sin red ni para leer: no sabe el estado y no permite generar hasta que el servidor responda', async () => {
    const h = harness();
    postResponse = 'network-down';
    serverDoc = 'network-down';

    await h.tracker.start(PAYLOAD);

    assert.equal(lastView(h)?.status, 'unconfirmed');
    await h.tracker.retry();
    assert.equal(posts.length, 1);

    serverDoc = processing;
    await h.tracker.check();
    assert.equal(lastView(h)?.status, 'running');
    assert.equal(posts.length, 1);
  });

  it('sin red y al volver el servidor dice que nada empezó: entonces sí ofrece reintento', async () => {
    const h = harness();
    postResponse = 'network-down';
    serverDoc = 'network-down';
    await h.tracker.start(PAYLOAD);

    serverDoc = {};
    await h.tracker.check();

    assert.equal(lastView(h)?.status, 'retryable');
  });

  it('el sondeo reconcilia solo, sin que el usuario pulse nada', async () => {
    const h = harness('wbs', 5);
    postResponse = 'network-down';
    serverDoc = 'network-down';
    await h.tracker.start(PAYLOAD);

    serverDoc = { wbs_generation_status: 'completed' };
    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.deepEqual(lastView(h), { status: 'idle' });
    assert.deepEqual(h.events, ['completed:false']);
  });

  it('un resultado hallado tras un fallo se marca como no confirmado', async () => {
    const h = harness('observations');
    postResponse = { status: 500 };
    serverDoc = { observations_generation_status: 'completed' };

    await h.tracker.start(PAYLOAD);

    assert.deepEqual(h.events, ['completed:false']);
  });

  it('500 con la generación marcada failed: muestra el error del servidor y ofrece reintento', async () => {
    const h = harness('observations');
    postResponse = { status: 500 };
    serverDoc = { observations_generation_status: 'failed', observations_generation_error: 'No se pudo encolar la tarea.' };

    await h.tracker.start(PAYLOAD);

    assert.deepEqual(lastView(h), { status: 'retryable', message: 'No se pudo encolar la tarea.' });
    assert.deepEqual(h.events, ['failed:No se pudo encolar la tarea.']);
  });
});

describe('B11: el seguimiento no depende solo del listener', () => {
  it('listener denegado tras el 202: el estado llega por la API', async () => {
    const h = harness();
    await h.tracker.start(PAYLOAD);
    serverDoc = { wbs_generation_status: 'completed' };

    h.failListener();
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(h.events, ['completed:true']);
    assert.deepEqual(lastView(h), { status: 'idle' });
  });

  it('tres lecturas fallidas seguidas avisan; la cuarta buena lo recupera', async () => {
    const h = harness();
    await h.tracker.start(PAYLOAD);
    serverDoc = 'network-down';

    await h.tracker.check();
    await h.tracker.check();
    assert.equal(lastView(h)?.status, 'running');
    await h.tracker.check();
    assert.equal(lastView(h)?.status, 'unconfirmed');

    serverDoc = processing;
    await h.tracker.check();
    assert.equal(lastView(h)?.status, 'running');
  });

  it('una generación sin progreso más allá del plazo del servidor deja de mostrarse como en curso', async () => {
    const h = harness();
    await h.tracker.start(PAYLOAD);
    serverDoc = { wbs_generation_status: 'processing', wbs_generation_updated_at: EXPIRED };

    await h.tracker.check();

    assert.equal(lastView(h)?.status, 'retryable');
    assert.equal(h.isListening(), false);
  });

  it('acepta el Timestamp del listener igual que el texto de la API', () => {
    const doc = { wbs_generation_status: 'queued', wbs_generation_updated_at: { toMillis: () => NOW - 1000 } };
    assert.equal(generation.readServerGeneration(doc, 'wbs', NOW).phase, 'running');
  });

  it('dispose detiene listener y sondeo', async () => {
    const h = harness('wbs', 5);
    await h.tracker.start(PAYLOAD);
    h.tracker.dispose();
    const readsAtDispose = reads;

    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(reads, readsAtDispose);
    assert.equal(h.isListening(), false);
  });
});

describe('B11: respuestas definitivas y reanudación', () => {
  for (const status of [400, 403, 404]) {
    it(`un ${status} es un rechazo: limpia sin leer el servidor`, async () => {
      const h = harness();
      postResponse = { status, body: { error: 'Rechazado.' } };

      await h.tracker.start(PAYLOAD);

      assert.deepEqual(lastView(h), { status: 'idle' });
      assert.deepEqual(h.events, ['rejected:Rechazado.']);
      assert.equal(reads, 0);
    });
  }

  it('409 in_progress sigue la generación existente', async () => {
    const h = harness();
    postResponse = { status: 409, body: { error: 'En curso.', reason: 'in_progress' } };

    await h.tracker.start(PAYLOAD);

    assert.equal(lastView(h)?.status, 'running');
    assert.equal(h.isListening(), true);
    assert.deepEqual(h.events, ['in-progress']);
  });

  it('409 already_exists no deja nada activo', async () => {
    const h = harness();
    postResponse = { status: 409, body: { error: 'Ya existe.', reason: 'already_exists' } };

    await h.tracker.start(PAYLOAD);

    assert.deepEqual(lastView(h), { status: 'idle' });
    assert.deepEqual(h.events, ['already-exists']);
  });

  it('tras recargar con una marca vieja y nada en el servidor, vuelve al botón sin aviso', async () => {
    const h = harness();

    await h.tracker.resume();

    assert.deepEqual(lastView(h), { status: 'idle' });
    assert.deepEqual(h.events, []);
  });

  it('tras recargar con generación en curso, la sigue', async () => {
    const h = harness();
    serverDoc = processing;

    await h.tracker.resume();

    assert.equal(lastView(h)?.status, 'running');
    assert.equal(h.isListening(), true);
  });

  it('tras recargar sin red, no habilita generar', async () => {
    const h = harness();
    serverDoc = 'network-down';

    await h.tracker.resume();

    assert.equal(lastView(h)?.status, 'unconfirmed');
  });
});
