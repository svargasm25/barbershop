'use client';

import { createEvents, type EventAttributes } from 'ics';

interface GenerateICSOptions {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM:SS
  haircutStyle: string;
  clientName: string;
}

export function generateAndDownloadICS({
  date,
  time,
  haircutStyle,
  clientName,
}: GenerateICSOptions): void {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  // End time is 30 minutes after start
  const endHour = minute >= 30 ? hour + 1 : hour;
  const endMinute = minute >= 30 ? minute - 30 : minute + 30;

  const event: EventAttributes = {
    start: [year, month, day, hour, minute],
    end: [year, month, day, endHour, endMinute],
    title: `💈 Dorm Barbershop — ${haircutStyle}`,
    description: `Haircut appointment at Dorm Barbershop.\nStyle: ${haircutStyle}\nClient: ${clientName}`,
    location: 'Dorm Barbershop',
    alarms: [
      { action: 'display', description: 'Haircut in 1 hour!', trigger: { hours: 1, minutes: 0, before: true } },
      { action: 'display', description: 'Haircut in 30 minutes!', trigger: { minutes: 30, before: true } },
    ],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  const { error, value } = createEvents([event]);

  if (error || !value) {
    console.error('ICS generation error:', error);
    return;
  }

  const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gyar-appointment-${date}-${time.slice(0, 5).replace(':', '')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
