import { useCallback, useEffect, useRef, useState } from 'react';
import { doc as firestoreDoc, onSnapshot } from 'firebase/firestore';
import apiClient from '@/lib/api-client';
import { db } from '@/lib/firebase';
import {
  createGenerationTracker,
  type GenerationHandlers,
  type GenerationKind,
  type GenerationTracker,
  type GenerationView,
} from '@/lib/ai-generation';

interface UseAiGenerationOptions {
  kind: GenerationKind;
  opportunityId: string;
  /** Estado que trajo la carga de la página. */
  serverStatus?: string;
  /** Este navegador recuerda una solicitud sin resolver. */
  initiallyActive?: boolean;
  handlers: GenerationHandlers;
}

const isInFlight = (status?: string) => status === 'queued' || status === 'processing';

/** Conecta el seguimiento de una generación IA con Firestore y con el ciclo de vida del componente. */
export function useAiGeneration<P>({
  kind,
  opportunityId,
  serverStatus,
  initiallyActive = false,
  handlers,
}: UseAiGenerationOptions) {
  const shouldResume = initiallyActive || isInFlight(serverStatus);
  const [view, setView] = useState<GenerationView>(
    shouldResume ? { status: 'running', progress: null } : { status: 'idle' },
  );
  const [isChecking, setIsChecking] = useState(false);

  const trackerRef = useRef<GenerationTracker<P> | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const shouldResumeRef = useRef(shouldResume);
  shouldResumeRef.current = shouldResume;

  useEffect(() => {
    const tracker = createGenerationTracker<P>({
      kind,
      opportunityId,
      post: (request) => apiClient.post(`/generate_${kind}`, request),
      subscribe: (onDoc, onError) =>
        onSnapshot(
          firestoreDoc(db, 'opportunities', opportunityId),
          (snap) => {
            // Lo que venga de caché puede ser de la generación anterior.
            if (snap.exists() && !snap.metadata.fromCache) onDoc(snap.data());
          },
          onError,
        ),
      handlers: {
        onCompleted: (result) => handlersRef.current.onCompleted(result),
        onFailed: (message) => handlersRef.current.onFailed(message),
        onRejected: (message) => handlersRef.current.onRejected(message),
        onInProgress: () => handlersRef.current.onInProgress(),
        onAlreadyExists: () => handlersRef.current.onAlreadyExists(),
      },
      onView: setView,
    });
    trackerRef.current = tracker;
    if (shouldResumeRef.current) void tracker.resume();

    const handleOnline = () => void tracker.check();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      tracker.dispose();
    };
  }, [kind, opportunityId]);

  const start = useCallback((payload: P) => trackerRef.current?.start(payload), []);
  const retry = useCallback(() => trackerRef.current?.retry(), []);
  const dismiss = useCallback(() => trackerRef.current?.dismiss(), []);
  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      await trackerRef.current?.check();
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { view, isChecking, start, retry, check, dismiss };
}
