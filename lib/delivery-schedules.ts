const TIME_ZONE = 'Africa/Lagos';
export type SchedulePeriod = 'Morning' | 'Afternoon' | 'Evening';
export function getSchedulePeriodFromHour(hour: number): SchedulePeriod {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
export function getSchedulePeriod(date: Date): SchedulePeriod {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(date));
  return getSchedulePeriodFromHour(hour);
}
export function formatDeliveryTime(date: Date) {
  return date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIME_ZONE });
}
export function formatDeliveryDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function decorateSchedule<T extends { startsAt: Date; endsAt: Date }>(schedule: T) {
  const period = getSchedulePeriod(schedule.startsAt);
  return { ...schedule, date: formatDeliveryDate(schedule.startsAt), startTime: formatDeliveryTime(schedule.startsAt), endTime: formatDeliveryTime(schedule.endsAt), period, label: `${period} delivery` };
}
