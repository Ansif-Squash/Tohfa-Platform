/**
 * Centralized UI string catalogue for the Farm Rating module.
 *
 * Per root CLAUDE.md §2.7, user-facing English strings live here, not inline in the
 * component. Module NAMES themselves are NOT here — they come from the API response
 * (`FarmRating.modules[].name`), because which modules are active is server-side
 * configuration (`rating_categories.is_active`), not a fixed client contract.
 */
export const FARM_RATING_STRINGS = {
  title: 'Farm Rating',
  subtitle: 'Score this farmer across the 5 active rating modules (0-10 each).',

  loading: 'Loading rating…',
  loadError: 'Could not load this farmer’s rating.',
  notFound: 'Farmer not found, or outside your assigned scope.',
  neverRated: 'This farmer has not been rated yet. Enter scores below to create the first rating cycle.',

  overallLabel: 'Overall Rating',
  tierLabel: 'Tier',
  tierUnset: 'Not yet rated',

  lastRatedLabel: 'Last rated',
  lastRatedNever: 'Never',

  notesLabel: 'Notes (optional)',
  notesPlaceholder: 'Observations for this rating cycle…',

  scoreHint: 'Whole number, 0–10',

  cancel: 'Cancel',
  save: 'Save Rating',
  saving: 'Saving…',

  saveError: 'Could not save this rating. Please check the scores and try again.',
  readOnlyNotice: 'You have view-only access to farm ratings.',

  backToFarmer: '← Back',

  tiers: {
    POOR: 'Poor',
    MODERATE: 'Moderate',
    GOOD: 'Good',
    EXCELLENT: 'Excellent',
  },
} as const;
