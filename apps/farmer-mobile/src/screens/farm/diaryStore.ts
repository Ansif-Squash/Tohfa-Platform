import { useEffect, useState } from 'react';

export interface DiaryItem {
  id: string;
  day: number; // 1-31
  monthYear: string; // e.g. 'July 2026'
  dateLabel: string; // e.g. 'THURSDAY, 16 JULY'
  title: string;
  field: string;
  time?: string | undefined;
  duration: string;
  type: 'irrigation' | 'pest' | 'manure' | 'harvest' | 'weeding';
  method?: string | undefined;
  labour?: string | undefined;
  notes?: string | undefined;
  hasPhotos?: boolean | undefined;
}

const INITIAL_ENTRIES: DiaryItem[] = [
  // ── Today: July 16, 2026 ──
  {
    id: 'entry-1',
    day: 16,
    monthYear: 'July 2026',
    dateLabel: 'THURSDAY, 16 JULY',
    title: 'Irrigation · Tomato',
    field: 'Zone 2 — Lower Slope · 07:10 AM',
    duration: '45m',
    type: 'irrigation',
    method: 'Method · Drip',
    labour: '2 labour',
    notes:
      'Morning drip cycle on the lower beds; checked emitters on rows 4–7, two were clogged and cleared.',
    hasPhotos: true,
  },
  {
    id: 'entry-2',
    day: 16,
    monthYear: 'July 2026',
    dateLabel: 'THURSDAY, 16 JULY',
    title: 'Pest scouting · Tomato',
    field: 'Zone 2 — Lower Slope · 08:30 AM',
    duration: '20m',
    type: 'pest',
    method: 'Visual check',
    labour: '1 labour',
    notes:
      'Checked leaf undersides for aphid colonies. Slight presence on border row; neem oil spray recommended tomorrow.',
  },
  {
    id: 'entry-3',
    day: 16,
    monthYear: 'July 2026',
    dateLabel: 'THURSDAY, 16 JULY',
    title: 'Manure application · Carrot',
    field: 'Zone 3 — Terrace · 11:00 AM',
    duration: '1h 15m',
    type: 'manure',
    method: 'Vermicompost ring',
    labour: '3 labour',
    notes:
      'Applied enriched vermicompost around bed root zones prior to evening sprinkler cycle.',
  },
  {
    id: 'entry-4',
    day: 16,
    monthYear: 'July 2026',
    dateLabel: 'THURSDAY, 16 JULY',
    title: 'Harvesting · Beans',
    field: 'Zone 1 — Upper Field · 02:15 PM',
    duration: '1h',
    type: 'harvest',
    method: 'Manual harvest',
    labour: '2 labour',
    notes:
      'Picked 45 kg tender French beans. Sorted into Grade A and B crates for market dispatch.',
  },

  // ── Sunday: July 12, 2026 ──
  {
    id: 'cal-12-1',
    day: 12,
    monthYear: 'July 2026',
    dateLabel: 'SUNDAY, 12 JULY',
    title: 'Weeding · Carrot',
    field: 'Zone 3 — Terrace · 06:45 AM',
    duration: '50m',
    type: 'weeding',
    method: 'Manual hoeing',
    labour: '1 labour',
    notes: 'Removed broadleaf weeds along bed furrows.',
  },
  {
    id: 'cal-12-2',
    day: 12,
    monthYear: 'July 2026',
    dateLabel: 'SUNDAY, 12 JULY',
    title: 'Irrigation · Tomato',
    field: 'Zone 2 — Lower Slope · 07:20 AM',
    duration: '40m',
    type: 'irrigation',
    method: 'Method · Drip',
    labour: '1 labour',
  },

  // ── Other days in July 2026 with mock entries ──
  {
    id: 'cal-1',
    day: 1,
    monthYear: 'July 2026',
    dateLabel: 'WEDNESDAY, 1 JULY',
    title: 'Soil Bed Preparation · Carrot',
    field: 'Zone 3 — Terrace · 08:00 AM',
    duration: '2h',
    type: 'manure',
  },
  {
    id: 'cal-2',
    day: 2,
    monthYear: 'July 2026',
    dateLabel: 'THURSDAY, 2 JULY',
    title: 'Irrigation · Tomato',
    field: 'Zone 2 — Lower Slope · 07:00 AM',
    duration: '45m',
    type: 'irrigation',
  },
  {
    id: 'cal-4',
    day: 4,
    monthYear: 'July 2026',
    dateLabel: 'SATURDAY, 4 JULY',
    title: 'Weed Mgmt · Beans',
    field: 'Zone 1 — Upper Field · 09:15 AM',
    duration: '1h',
    type: 'weeding',
  },
  {
    id: 'cal-5',
    day: 5,
    monthYear: 'July 2026',
    dateLabel: 'SUNDAY, 5 JULY',
    title: 'Irrigation · Tomato',
    field: 'Zone 2 — Lower Slope · 07:30 AM',
    duration: '45m',
    type: 'irrigation',
  },
  {
    id: 'cal-6',
    day: 6,
    monthYear: 'July 2026',
    dateLabel: 'MONDAY, 6 JULY',
    title: 'Fertilizer Application · Carrot',
    field: 'Zone 3 — Terrace · 10:00 AM',
    duration: '1h 30m',
    type: 'manure',
  },
  {
    id: 'cal-8',
    day: 8,
    monthYear: 'July 2026',
    dateLabel: 'WEDNESDAY, 8 JULY',
    title: 'Irrigation · Tomato',
    field: 'Zone 2 — Lower Slope · 07:15 AM',
    duration: '40m',
    type: 'irrigation',
  },
  {
    id: 'cal-9',
    day: 9,
    monthYear: 'July 2026',
    dateLabel: 'THURSDAY, 9 JULY',
    title: 'Pest Scouting · Beans',
    field: 'Zone 1 — Upper Field · 08:45 AM',
    duration: '25m',
    type: 'pest',
  },
  {
    id: 'cal-10',
    day: 10,
    monthYear: 'July 2026',
    dateLabel: 'FRIDAY, 10 JULY',
    title: 'Irrigation · Tomato',
    field: 'Zone 2 — Lower Slope · 07:00 AM',
    duration: '45m',
    type: 'irrigation',
  },
  {
    id: 'cal-13',
    day: 13,
    monthYear: 'July 2026',
    dateLabel: 'MONDAY, 13 JULY',
    title: 'Compost Dressing · Beans',
    field: 'Zone 1 — Upper Field · 10:30 AM',
    duration: '1h 10m',
    type: 'manure',
  },
  {
    id: 'cal-14',
    day: 14,
    monthYear: 'July 2026',
    dateLabel: 'TUESDAY, 14 JULY',
    title: 'Irrigation · Tomato',
    field: 'Zone 2 — Lower Slope · 07:15 AM',
    duration: '40m',
    type: 'irrigation',
  },
  {
    id: 'cal-15',
    day: 15,
    monthYear: 'July 2026',
    dateLabel: 'WEDNESDAY, 15 JULY',
    title: 'Weed Control · Carrot',
    field: 'Zone 3 — Terrace · 08:30 AM',
    duration: '50m',
    type: 'weeding',
  },
];

let diaryEntries: DiaryItem[] = [...INITIAL_ENTRIES];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getDiaryEntries(): DiaryItem[] {
  return diaryEntries;
}

export function getEntriesForDay(day: number, monthYear = 'July 2026'): DiaryItem[] {
  return diaryEntries.filter((e) => e.day === day && e.monthYear === monthYear);
}

export function getTodayEntries(): DiaryItem[] {
  return diaryEntries.filter((e) => e.day === 16 && e.monthYear === 'July 2026');
}

export function getDaysWithEntries(monthYear = 'July 2026'): Set<number> {
  const days = new Set<number>();
  diaryEntries.forEach((e) => {
    if (e.monthYear === monthYear) {
      days.add(e.day);
    }
  });
  return days;
}

export function addDiaryEntry(newEntry: Omit<DiaryItem, 'id'> & { id?: string }): DiaryItem {
  const item: DiaryItem = {
    ...newEntry,
    id: newEntry.id ?? `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  // Prepend to entries so newest is first
  diaryEntries = [item, ...diaryEntries];
  notify();
  return item;
}

export function useDiaryStore(): {
  entries: DiaryItem[];
  todayEntries: DiaryItem[];
  getEntriesForDay: (day: number, monthYear?: string) => DiaryItem[];
  getDaysWithEntries: (monthYear?: string) => Set<number>;
  addEntry: (entry: Omit<DiaryItem, 'id'> & { id?: string }) => DiaryItem;
} {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleChange = () => setTick((t) => t + 1);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return {
    entries: diaryEntries,
    todayEntries: getTodayEntries(),
    getEntriesForDay,
    getDaysWithEntries,
    addEntry: addDiaryEntry,
  };
}
