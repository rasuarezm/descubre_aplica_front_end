export interface SubscriptionBadgeEntry {
  label: string;
  className: string;
}

const SUBSCRIPTION_BADGES: Record<string, SubscriptionBadgeEntry> = {
  al_dia: { label: 'Al dia', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  por_vencer: { label: 'Por vencer', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  vencido: { label: 'Vencido', className: 'bg-destructive/10 text-destructive' },
  suspendido: { label: 'Suspendido', className: 'bg-destructive/10 text-destructive' },
  prueba_gratuita: { label: 'Prueba', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  sin_fecha: { label: 'Sin fecha', className: 'bg-muted text-muted-foreground' },
  inactivo: { label: 'Inactivo', className: 'bg-muted text-muted-foreground' },
  desconocido: { label: 'Sin datos', className: 'bg-muted text-muted-foreground' },
};

export function subscriptionBadgeEntry(state: string | null | undefined): SubscriptionBadgeEntry {
  return SUBSCRIPTION_BADGES[state ?? ''] ?? SUBSCRIPTION_BADGES.desconocido;
}
