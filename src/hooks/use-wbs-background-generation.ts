import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { clearWbsGenerating, isWbsGenerating } from '@/lib/wbs-generating-state';

const WBS_POLL_INTERVAL_MS = 10_000;

/**
 * Refresca la oportunidad mientras hay una generación WBS en curso (sessionStorage)
 * y avisa con toast si el WBS aparece mientras el usuario está en otra pestaña.
 */
export function useWbsBackgroundGeneration(
  opportunityId: string,
  hasWbs: boolean,
  onRefresh: () => void,
): void {
  const { toast } = useToast();

  useEffect(() => {
    if (!opportunityId) return;

    if (hasWbs) {
      if (isWbsGenerating(opportunityId)) {
        clearWbsGenerating(opportunityId);
        toast({
          title: 'WBS generado',
          description:
            'La estructura de desglose de trabajo ya está disponible en la pestaña Propuesta.',
        });
      }
      return;
    }

    if (!isWbsGenerating(opportunityId)) return;

    const poll = () => onRefresh();
    poll();
    const intervalId = setInterval(poll, WBS_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [opportunityId, hasWbs, onRefresh, toast]);
}
