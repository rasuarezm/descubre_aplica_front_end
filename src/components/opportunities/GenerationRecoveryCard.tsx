"use client";

import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import type { GenerationView } from '@/lib/ai-generation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GenerationRecoveryCardProps {
  view: Extract<GenerationView, { status: 'unconfirmed' | 'retryable' }>;
  isChecking: boolean;
  onCheck: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export function GenerationRecoveryCard({
  view,
  isChecking,
  onCheck,
  onRetry,
  onDismiss,
}: GenerationRecoveryCardProps) {
  if (view.status === 'unconfirmed') {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h3 className="text-lg font-semibold">No pudimos confirmar el estado</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Perdimos contacto con el servidor. La generación pudo haber empezado, así que no
            iniciaremos otra hasta confirmarlo. Seguimos comprobando.
          </p>
          <Button variant="outline" onClick={onCheck} disabled={isChecking}>
            {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comprobar ahora
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50 border-dashed">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h3 className="text-lg font-semibold">La generación no terminó</h3>
        <p className="text-sm text-muted-foreground max-w-md">{view.message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={onDismiss}>
            Elegir otros documentos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
