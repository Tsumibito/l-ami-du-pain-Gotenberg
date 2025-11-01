import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { fr } from 'date-fns/locale';

const TIMEZONE = 'Europe/Paris';

/**
 * Format ISO date string to Paris timezone date
 * Example: "2025-10-31T08:30:00Z" → "31/10/2025"
 */
export function formatDateParis(isoDate: string): string {
  try {
    const date = parseISO(isoDate);
    const zonedDate = toZonedTime(date, TIMEZONE);
    return format(zonedDate, 'dd/MM/yyyy', { locale: fr });
  } catch (error) {
    return isoDate;
  }
}

/**
 * Format ISO date string to readable format in French
 * Example: "2025-10-31" → "vendredi 31 octobre 2025"
 */
export function formatDateReadable(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const zonedDate = toZonedTime(date, TIMEZONE);
    return format(zonedDate, 'EEEE d MMMM yyyy', { locale: fr });
  } catch (error) {
    return dateStr;
  }
}

/**
 * Format YYYY-MM-DD date to dd/MM/yyyy
 */
export function formatYMD(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateStr;
  }
}
