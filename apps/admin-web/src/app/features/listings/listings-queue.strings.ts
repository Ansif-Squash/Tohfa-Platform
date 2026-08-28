/**
 * Centralized UI string catalogue for the Listings Queue module (S-23).
 *
 * Per root CLAUDE.md §2.7 and S-23 requirements, user-facing English strings
 * are centralized here. The admin-web app does not currently have an i18n
 * translation framework (unlike the mobile apps), so this centralized
 * catalogue serves as the single source of truth and marks the missing
 * i18n catalogue as a documented platform gap.
 */

export const LISTINGS_STRINGS = {
  TITLE: 'Produce Listings Queue',
  SUBTITLE: 'Review and approve farmer produce listings, send counter-offers, or reject with feedback.',
  
  // Filters & Tabs
  FILTER_ALL: 'All Listings',
  FILTER_PENDING: 'Pending Approval',
  FILTER_COUNTERED: 'Counter-Offered',
  FILTER_ACCEPTED: 'Accepted',
  FILTER_REJECTED: 'Rejected',
  FILTER_WITHDRAWN: 'Withdrawn',
  SEARCH_PLACEHOLDER: 'Filter by Crop Name or Farmer...',
  REFRESH_BTN: 'Refresh Queue',

  // Table Columns
  COL_LISTING_NO: 'Listing #',
  COL_FARMER: 'Farmer',
  COL_CROP: 'Crop & Grade',
  COL_QUANTITY: 'Quantity',
  COL_PRICING: 'Price / Ceiling',
  COL_STATUS: 'Status',
  COL_ROUNDS: 'Round',
  COL_COUNTDOWN: 'Response Window',
  COL_ACTIONS: 'Actions',

  // Badges & Indicators
  ROUTED_AWAY_BADGE: 'Routed Away (Self-Approval)',
  ROUTED_AWAY_TOOLTIP: 'You own this listing (BR-29). Action buttons are disabled and this listing has been routed to another admin.',
  LAPSED_BADGE: 'Lapsed (24h Expired)',
  NO_OFFER: 'No Active Offer',
  EMPTY_QUEUE: 'No produce listings match the selected filters.',

  // Action Buttons
  BTN_APPROVE: 'Approve',
  BTN_COUNTER: 'Counter-Offer',
  BTN_REJECT: 'Reject',
  BTN_CANCEL: 'Cancel',
  BTN_SUBMIT: 'Submit',
  BTN_CONFIRM_APPROVE: 'Confirm & Generate PO',
  BTN_CONFIRM_COUNTER: 'Send Counter-Offer',
  BTN_CONFIRM_REJECT: 'Reject Listing',

  // Modals & Drawers
  // Approve Modal
  APPROVE_TITLE: 'Approve Listing',
  APPROVE_DESC: 'Approving this listing accepts the terms and generates an automated purchase order for warehouse delivery.',
  LABEL_DEST_WAREHOUSE: 'Destination Warehouse',
  SELECT_WAREHOUSE_PLACEHOLDER: 'Select Warehouse...',
  LABEL_DELIVERY_DATE: 'Expected Delivery Date',
  LABEL_APPROVE_NOTE: 'Approval Note (Optional)',
  APPROVE_NOTE_PLACEHOLDER: 'e.g. Schedule morning intake slot at Ooty warehouse.',

  // Counter Modal
  COUNTER_TITLE: 'Send Counter-Offer to Farmer',
  COUNTER_DESC: 'Negotiate price and quantity. The farmer will have 24 hours to accept, reject, or counter back (BR-10, BR-11).',
  LABEL_COUNTER_PRICE: 'Proposed Price per kg (INR)',
  LABEL_COUNTER_QTY: 'Proposed Quantity (kg)',
  LABEL_COUNTER_MSG: 'Reason / Message for Farmer',
  COUNTER_MSG_PLACEHOLDER: 'e.g. Demand is high for 150 kg; willing to take at INR 48.00/kg.',
  ROUNDS_REMAINING: (used: number) => `Round ${used + 1} of 3 (Max 3 rounds allowed per BR-11)`,
  ROUNDS_EXHAUSTED: 'All 3 counter rounds have been exhausted (BR-11). You must approve or reject this listing.',

  // Reject Modal
  REJECT_TITLE: 'Reject Produce Listing',
  REJECT_DESC: 'Provide a structured reason code and detailed explanation that will be shared with the farmer.',
  LABEL_REJECT_CODE: 'Rejection Reason Code',
  LABEL_REJECT_REASON: 'Detailed Reason',
  REJECT_REASON_PLACEHOLDER: 'Explain clearly why this produce listing cannot be accepted at this time...',

  // Messages & Toast alerts
  SUCCESS_APPROVED: 'Listing approved and purchase order raised successfully.',
  SUCCESS_COUNTERED: 'Counter-offer sent to farmer with 24-hour response clock.',
  SUCCESS_REJECTED: 'Listing rejected successfully.',
  ERROR_GENERIC: 'An error occurred while processing your request.',
  ERROR_ROUTED_SELF: 'Action refused: As a Farmer Admin, you cannot act on your own listings (BR-29).',
  ERROR_EXPIRED: 'This counter-offer has already expired (BR-10).',
  ERROR_LIMIT_REACHED: 'Maximum 3 counter rounds reached for this listing (BR-11).',
} as const;
