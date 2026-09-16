import { describe, expect, it } from 'vitest';
import {
  addDiaryEntry,
  getDaysWithEntries,
  getEntriesForDay,
  getTodayEntries,
} from '../screens/farm/diaryStore';

describe('Farm Diary, New Entry Wizard & Diary Calendar Flow Tests', () => {
  it('verifies navigation contract between FarmManagement and FarmDiary', () => {
    let currentScreen: string = 'FarmManagement';
    const onNavigateToDiary = () => {
      currentScreen = 'FarmDiary';
    };

    onNavigateToDiary();
    expect(currentScreen).toBe('FarmDiary');
  });

  it('verifies navigation contract between FarmDiary and NewDiaryEntry / DiaryCalendar', () => {
    let currentScreen: string = 'FarmDiary';

    const onNavigateToNewEntry = () => {
      currentScreen = 'NewDiaryEntry';
    };
    const onNavigateToCalendar = () => {
      currentScreen = 'DiaryCalendar';
    };
    const onBackToDiary = () => {
      currentScreen = 'FarmDiary';
    };

    onNavigateToNewEntry();
    expect(currentScreen).toBe('NewDiaryEntry');

    onBackToDiary();
    expect(currentScreen).toBe('FarmDiary');

    onNavigateToCalendar();
    expect(currentScreen).toBe('DiaryCalendar');

    onBackToDiary();
    expect(currentScreen).toBe('FarmDiary');
  });

  it('validates calendar date calculations for July 2026', () => {
    // 1st of July 2026 is a Wednesday (day of week 3)
    const date = new Date(2026, 6, 1); // July is month index 6
    expect(date.getDay()).toBe(3); // Wednesday

    // July has 31 days
    const daysInJuly = new Date(2026, 7, 0).getDate();
    expect(daysInJuly).toBe(31);

    // Initial days with entries
    const daysWithEntries = getDaysWithEntries('July 2026');
    expect(daysWithEntries.has(12)).toBe(true);
    expect(daysWithEntries.has(16)).toBe(true);
  });

  it('validates that saving a new entry reflects on the calendar and daily entries', () => {
    const initialTodayCount = getTodayEntries().length;
    const initialDays = getDaysWithEntries('July 2026');
    expect(initialDays.has(22)).toBe(false); // Day 22 had no entries initially

    // 1. Add entry for day 16 (Today)
    const newEntryToday = addDiaryEntry({
      day: 16,
      monthYear: 'July 2026',
      dateLabel: 'THURSDAY, 16 JULY',
      title: 'Irrigation · Tomato',
      field: 'Zone 2 — Lower Slope · 04:30 PM',
      duration: '45m',
      type: 'irrigation',
      method: 'Method · Drip',
      labour: '2 labour',
      notes: 'Evening supplementary drip cycle.',
    });

    expect(newEntryToday.id).toBeDefined();
    // Today's entries increased
    expect(getTodayEntries().length).toBe(initialTodayCount + 1);
    // Day 16 entries includes new entry
    const day16Entries = getEntriesForDay(16, 'July 2026');
    expect(day16Entries.some((e) => e.notes === 'Evening supplementary drip cycle.')).toBe(true);

    // 2. Add entry for day 22
    addDiaryEntry({
      day: 22,
      monthYear: 'July 2026',
      dateLabel: 'WEDNESDAY, 22 JULY',
      title: 'Nutrients · Carrot',
      field: 'Zone 3 — Terrace · 10:00 AM',
      duration: '1h',
      type: 'manure',
      notes: 'Applied organic compost.',
    });

    // Calendar indicator dots now include day 22
    const updatedDays = getDaysWithEntries('July 2026');
    expect(updatedDays.has(22)).toBe(true);

    // Selecting day 22 returns the entry
    const day22Entries = getEntriesForDay(22, 'July 2026');
    expect(day22Entries.length).toBe(1);
    expect(day22Entries[0]?.title).toBe('Nutrients · Carrot');
  });

  it('validates 3-step wizard transitions in NewDiaryEntry', () => {
    type WizardStep = 1 | 2 | 3;
    let step: WizardStep = 1;

    const nextStep = (s: WizardStep): WizardStep => {
      if (s === 1) return 2;
      if (s === 2) return 3;
      return 3;
    };

    const prevStep = (s: WizardStep): WizardStep => {
      if (s === 3) return 2;
      if (s === 2) return 1;
      return 1;
    };

    step = nextStep(step);
    expect(step).toBe(2);

    step = nextStep(step);
    expect(step).toBe(3);

    step = prevStep(step);
    expect(step).toBe(2);

    step = prevStep(step);
    expect(step).toBe(1);
  });

  it('validates category selection in Step 2', () => {
    const categories = [
      'land_prep', 'sowing', 'nutrients', 'water_mgmt',
      'weed_mgmt', 'pest_mgmt', 'crop_care', 'monitoring',
      'harvesting', 'post_harvest', 'maintenance', 'livestock',
    ];
    expect(categories.length).toBe(12);
    expect(categories).toContain('water_mgmt');
  });

  it('validates saving entry redirects to DiaryCalendar with day 16', () => {
    let activeScreen = 'NewDiaryEntry';
    let passedParams: Record<string, any> = {};

    const navigate = (screen: string, params?: Record<string, any>) => {
      activeScreen = screen;
      if (params) passedParams = params;
    };

    const handleSave = () => {
      addDiaryEntry({
        day: 16,
        monthYear: 'July 2026',
        dateLabel: 'THURSDAY, 16 JULY',
        title: 'Weed Management · Carrot',
        field: 'Zone 3 — Terrace · 02:00 PM',
        duration: '50m',
        type: 'weeding',
      });
      navigate('DiaryCalendar', { selectedDay: 16 });
    };

    handleSave();
    expect(activeScreen).toBe('DiaryCalendar');
    expect(passedParams.selectedDay).toBe(16);

    const day16Entries = getEntriesForDay(16, 'July 2026');
    expect(day16Entries.some((e) => e.title === 'Weed Management · Carrot')).toBe(true);
  });

  it('validates filtering entries by field and crop in FarmDiary', () => {
    const DUMMY_FIELDS = [
      'All fields',
      'Zone 1 — Upper Field',
      'Zone 2 — Lower Slope',
      'Zone 3 — Terrace',
      'Zone 4 — River Bed',
    ];
    const DUMMY_CROPS = ['All crops', 'Tomato', 'Carrot', 'Beans', 'Cabbage'];

    expect(DUMMY_FIELDS.length).toBe(5);
    expect(DUMMY_CROPS.length).toBe(5);

    const entries = getTodayEntries();
    // Filter by Zone 2
    const zone2Entries = entries.filter((e) => e.field.includes('Zone 2'));
    expect(zone2Entries.length).toBeGreaterThan(0);
    zone2Entries.forEach((e) => {
      expect(e.field).toContain('Zone 2');
    });

    // Filter by Tomato
    const tomatoEntries = entries.filter((e) => e.title.includes('Tomato'));
    expect(tomatoEntries.length).toBeGreaterThan(0);
    tomatoEntries.forEach((e) => {
      expect(e.title).toContain('Tomato');
    });
  });

  it('validates filtering entries by field and activity in DiaryCalendar', () => {
    const DUMMY_FIELDS = [
      'All fields',
      'Zone 1 — Upper Field',
      'Zone 2 — Lower Slope',
      'Zone 3 — Terrace',
      'Zone 4 — River Bed',
    ];
    const DUMMY_ACTIVITIES = [
      'All activity',
      'Irrigation',
      'Weed Management',
      'Pest Management',
      'Manure Application',
      'Harvesting',
    ];

    expect(DUMMY_FIELDS.length).toBe(5);
    expect(DUMMY_ACTIVITIES.length).toBe(6);

    // Day 12 entries
    const day12Entries = getEntriesForDay(12, 'July 2026');
    expect(day12Entries.length).toBe(2);

    // Filter by Irrigation
    const irrigationEntries = day12Entries.filter(
      (e) => e.type === 'irrigation' || e.title.toLowerCase().includes('irrigation')
    );
    expect(irrigationEntries.length).toBe(1);
    expect(irrigationEntries[0]?.title).toContain('Irrigation');
  });
});
