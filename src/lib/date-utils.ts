import { differenceInDays, differenceInHours, differenceInMinutes, isPast, format as formatDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

export type UrgencyStatus = 'overdue' | 'urgent' | 'upcoming' | 'normal';

export interface UrgencyInfo {
  status: UrgencyStatus;
  label: string;
  timeValue: number;
  timeUnit: 'días' | 'horas' | 'minutos' | null;
  deadlineFormatted: string;
  cssClass: string;
}

const BOGOTA_TIME_ZONE = 'America/Bogota';

/**
 * Parsea `fecha_limite_ofertas` del API Descubre (p. ej. `dd/MM/yyyy HH:mm …` en hora Bogotá).
 * Colombia usa UTC−05:00 sin DST; el instante se normaliza para alimentar `getUrgencyInfo`.
 */
export function parseDescubreFechaLimiteOfertas(value: string | undefined | null): Date | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'No especificada') return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || trimmed.includes('T')) {
    const d = new Date(trimmed.replace('Z', '+00:00'));
    if (!Number.isNaN(d.getTime())) return d;
  }

  const m = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, dd, mm, yyyy, HH, MM] = m;
  const d = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}:00-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const getUrgencyInfo = (deadline: Date): UrgencyInfo => {
  const nowInBogota = toZonedTime(new Date(), BOGOTA_TIME_ZONE);
  const deadlineInBogota = toZonedTime(deadline, BOGOTA_TIME_ZONE);
  
  const deadlineFormatted = formatDate(deadlineInBogota, "dd MMM yyyy, p", { locale: es });

  if (isPast(deadlineInBogota)) {
    return {
      status: 'overdue',
      label: 'Plazo cumplido',
      timeValue: 0,
      timeUnit: null,
      deadlineFormatted,
      cssClass: 'text-urgency',
    };
  }

  const hoursRemaining = differenceInHours(deadlineInBogota, nowInBogota);

  if (hoursRemaining < 1) {
    const minutesRemaining = differenceInMinutes(deadlineInBogota, nowInBogota);
    return {
      status: 'urgent',
      label: minutesRemaining === 1 ? 'minuto restante' : 'minutos restantes',
      timeValue: minutesRemaining,
      timeUnit: 'minutos',
      deadlineFormatted,
      cssClass: 'text-highlight',
    };
  }
  
  if (hoursRemaining < 48) {
    return {
      status: 'urgent',
      label: hoursRemaining === 1 ? 'hora restante' : 'horas restantes',
      timeValue: hoursRemaining,
      timeUnit: 'horas',
      deadlineFormatted,
      cssClass: 'text-highlight',
    };
  }
  
  const daysRemaining = differenceInDays(deadlineInBogota, nowInBogota);

  if (daysRemaining < 8) {
     return {
      status: 'urgent',
      label: daysRemaining === 1 ? 'día restante' : 'días restantes',
      timeValue: daysRemaining,
      timeUnit: 'días',
      deadlineFormatted,
      cssClass: 'text-highlight',
    };
  }

  if (daysRemaining <= 14) {
    return {
      status: 'upcoming',
      label: daysRemaining === 1 ? 'día restante' : 'días restantes',
      timeValue: daysRemaining,
      timeUnit: 'días',
      deadlineFormatted,
      cssClass: 'text-highlight',
    };
  }

  return {
    status: 'normal',
    label: daysRemaining === 1 ? 'día restante' : 'días restantes',
    timeValue: daysRemaining,
    timeUnit: 'días',
    deadlineFormatted,
    cssClass: 'text-muted-foreground',
  };
};
