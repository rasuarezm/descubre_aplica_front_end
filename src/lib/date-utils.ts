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
      cssClass: 'text-destructive',
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
      cssClass: 'text-destructive',
    };
  }
  
  if (hoursRemaining < 48) {
    return {
      status: 'urgent',
      label: hoursRemaining === 1 ? 'hora restante' : 'horas restantes',
      timeValue: hoursRemaining,
      timeUnit: 'horas',
      deadlineFormatted,
      cssClass: 'text-destructive',
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
      cssClass: 'text-destructive',
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
