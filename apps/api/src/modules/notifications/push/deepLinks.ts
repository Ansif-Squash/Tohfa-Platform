export type NotificationTemplateCode =
  | 'FARMER_APP_APPROVED'
  | 'FARMER_APP_REJECTED'
  | 'FARMER_APP_INFO_REQUESTED'
  | 'COUNTER_OFFER_RECEIVED'
  | 'COUNTER_OFFER_EXPIRING'
  | 'GOODS_RECEIVED'
  | 'PAYOUT_RELEASED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'WALLET_CREDITED';

export interface DeepLinkMapping {
  app: 'farmer-mobile' | 'customer-mobile';
  screen: string;
  url: string;
  params?: Record<string, string>;
}

export type DeepLinkResolver = (data: Record<string, unknown>) => DeepLinkMapping;

/**
 * Table-driven registry of deep links for all notification template types.
 * Typed as Record<NotificationTemplateCode, ...> so any missing template code is a compile error.
 */
export const NOTIFICATION_DEEP_LINKS: Record<NotificationTemplateCode, DeepLinkResolver> = {
  FARMER_APP_APPROVED: () => ({
    app: 'farmer-mobile',
    screen: 'ApplicationStatus',
    url: 'tohfa-farmer://app/application-status',
  }),
  FARMER_APP_REJECTED: () => ({
    app: 'farmer-mobile',
    screen: 'ApplicationStatus',
    url: 'tohfa-farmer://app/application-status',
  }),
  FARMER_APP_INFO_REQUESTED: () => ({
    app: 'farmer-mobile',
    screen: 'ApplicationStatus',
    url: 'tohfa-farmer://app/application-status',
  }),
  COUNTER_OFFER_RECEIVED: (data) => {
    const listingId = String(data['listingId'] ?? '');
    return {
      app: 'farmer-mobile',
      screen: 'CounterOffer',
      url: `tohfa-farmer://app/counter-offer?listingId=${encodeURIComponent(listingId)}`,
      params: { listingId },
    };
  },
  COUNTER_OFFER_EXPIRING: (data) => {
    const listingId = String(data['listingId'] ?? '');
    return {
      app: 'farmer-mobile',
      screen: 'CounterOffer',
      url: `tohfa-farmer://app/counter-offer?listingId=${encodeURIComponent(listingId)}`,
      params: { listingId },
    };
  },
  GOODS_RECEIVED: (data) => {
    const grnNumber = String(data['grnNumber'] ?? '');
    return {
      app: 'farmer-mobile',
      screen: 'MainTabs',
      url: `tohfa-farmer://app/main-tabs?tab=Listings&grn=${encodeURIComponent(grnNumber)}`,
      params: { tab: 'Listings', grnNumber },
    };
  },
  PAYOUT_RELEASED: (data) => {
    const payoutId = String(data['payoutId'] ?? '');
    return {
      app: 'farmer-mobile',
      screen: 'MainTabs',
      url: `tohfa-farmer://app/main-tabs?tab=Wallet&payoutId=${encodeURIComponent(payoutId)}`,
      params: { tab: 'Wallet', payoutId },
    };
  },
  ORDER_CONFIRMED: (data) => {
    const orderId = String(data['orderId'] ?? '');
    return {
      app: 'customer-mobile',
      screen: 'OrderTracking',
      url: `tohfa-customer://app/order-tracking?orderId=${encodeURIComponent(orderId)}`,
      params: { orderId },
    };
  },
  ORDER_DISPATCHED: (data) => {
    const orderId = String(data['orderId'] ?? '');
    return {
      app: 'customer-mobile',
      screen: 'OrderTracking',
      url: `tohfa-customer://app/order-tracking?orderId=${encodeURIComponent(orderId)}`,
      params: { orderId },
    };
  },
  ORDER_DELIVERED: (data) => {
    const orderId = String(data['orderId'] ?? '');
    return {
      app: 'customer-mobile',
      screen: 'OrderHistory',
      url: `tohfa-customer://app/order-history?orderId=${encodeURIComponent(orderId)}`,
      params: { orderId },
    };
  },
  WALLET_CREDITED: () => ({
    app: 'customer-mobile',
    screen: 'Topup',
    url: 'tohfa-customer://app/topup',
  }),
};

export function resolveDeepLink(
  templateCode: string,
  data: Record<string, unknown> = {},
): DeepLinkMapping | null {
  const resolver = NOTIFICATION_DEEP_LINKS[templateCode as NotificationTemplateCode];
  if (!resolver) return null;
  return resolver(data);
}
