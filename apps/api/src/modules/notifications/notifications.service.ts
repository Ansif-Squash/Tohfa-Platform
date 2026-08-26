import type { Actor } from '../../auth/requireAuth.js';
import { pool } from '../../db/pool.js';
import { eventBus, type DomainEventName, type DomainEvents, type EventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import { logger } from '../../logger.js';
import {
  notificationsRepo,
  type NotificationRow,
  type NotificationsRepo,
} from './notifications.repo.js';
import type { ListNotificationsQuery } from './notifications.schema.js';

export const EVENT_TEMPLATE_MAP: Record<DomainEventName, string> = {
  'farmer.application.approved': 'FARMER_APP_APPROVED',
  'farmer.application.rejected': 'FARMER_APP_REJECTED',
  'farmer.application.info_requested': 'FARMER_APP_INFO_REQUESTED',
  'counter_offer.received': 'COUNTER_OFFER_RECEIVED',
  'counter_offer.expiring': 'COUNTER_OFFER_EXPIRING',
  'goods.received': 'GOODS_RECEIVED',
  'payout.released': 'PAYOUT_RELEASED',
  'order.confirmed': 'ORDER_CONFIRMED',
  'order.dispatched': 'ORDER_DISPATCHED',
  'order.delivered': 'ORDER_DELIVERED',
  'wallet.credited': 'WALLET_CREDITED',
};

export function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = data[key];
    if (val === undefined || val === null) return '';
    return String(val);
  });
}

function mapNotificationResponse(row: NotificationRow) {
  return {
    id: row.id,
    channel: row.channel,
    title: row.title,
    body: row.body,
    locale: row.locale,
    data: row.data,
    readAt: row.read_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export interface NotificationsService {
  listMyNotifications(actor: Actor, query: ListNotificationsQuery): Promise<unknown>;
  markAsRead(actor: Actor, id: string): Promise<unknown>;
  handleDomainEvent<E extends DomainEventName>(
    eventName: E,
    payload: DomainEvents[E],
  ): Promise<NotificationRow | null>;
}

export function createNotificationsService(
  repo: NotificationsRepo = notificationsRepo,
): NotificationsService {
  return {
    async listMyNotifications(actor, query) {
      const { items, nextCursor, hasMore, unreadCount } = await repo.listByUserId(
        pool,
        actor.userId,
        {
          limit: query.limit,
          cursor: query.cursor,
          unreadOnly: query.unreadOnly,
        },
      );

      return {
        items: items.map(mapNotificationResponse),
        page: { nextCursor, hasMore },
        unreadCount,
      };
    },

    async markAsRead(actor, id) {
      const updated = await repo.markAsRead(pool, id, actor.userId);
      if (updated === null) {
        throw new AppError('NOT_FOUND', { detail: 'Notification not found.' });
      }
      return mapNotificationResponse(updated);
    },

    async handleDomainEvent(eventName, payload) {
      const templateCode = EVENT_TEMPLATE_MAP[eventName];
      if (!templateCode) return null;

      const userId = (payload as { userId?: string }).userId;
      if (!userId) return null;

      const locale = await repo.getUserPreferredLocale(pool, userId);
      const template = await repo.findTemplate(pool, templateCode, 'IN_APP', locale);

      if (!template) {
        logger.warn(
          { templateCode, locale, eventName },
          'notification template not found; skipping in-app delivery',
        );
        return null;
      }

      const rawData = payload as unknown as Record<string, unknown>;
      const title = template.subject ? interpolateTemplate(template.subject, rawData) : null;
      const body = interpolateTemplate(template.body_template, rawData);

      // Construct deduplication key for idempotent delivery
      const dedupeEntityId =
        rawData['applicationId'] ??
        rawData['orderId'] ??
        rawData['listingId'] ??
        rawData['payoutId'] ??
        rawData['grnNumber'] ??
        rawData['reference'] ??
        '';

      const dedupeKey = `${eventName}:${userId}:${dedupeEntityId}`;

      return repo.createNotification(pool, {
        userId,
        templateId: template.id,
        channel: 'IN_APP',
        title,
        body,
        locale: template.locale,
        data: rawData,
        dedupeKey,
      });
    },
  };
}

export const notificationsService = createNotificationsService();

/**
 * Registers notification subscribers for all 11 golden-thread domain events.
 */
export function registerNotificationSubscribers(
  bus: EventBus = eventBus,
  service: NotificationsService = notificationsService,
): () => void {
  const unsubs: Array<() => void> = [];

  const eventNames = Object.keys(EVENT_TEMPLATE_MAP) as DomainEventName[];
  for (const eventName of eventNames) {
    const unsub = bus.subscribe(eventName, async (payload) => {
      await service.handleDomainEvent(eventName, payload);
    });
    unsubs.push(unsub);
  }

  return () => {
    for (const unsub of unsubs) unsub();
  };
}

// Auto-register on load
registerNotificationSubscribers();
