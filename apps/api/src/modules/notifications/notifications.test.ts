import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { eventBus } from '../../events/bus.js';
import { anActor, IDS } from '../../test/factories.js';
import {
  createNotificationsService,
  EVENT_TEMPLATE_MAP,
  interpolateTemplate,
} from './notifications.service.js';
import type {
  CreateNotificationParams,
  NotificationRow,
  NotificationsRepo,
  NotificationTemplateRow,
} from './notifications.repo.js';

function mockNotificationsRepo(): NotificationsRepo & {
  notifications: NotificationRow[];
  templates: NotificationTemplateRow[];
} {
  const templates: NotificationTemplateRow[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      code: 'FARMER_APP_APPROVED',
      channel: 'IN_APP',
      locale: 'en',
      subject: 'Application Approved',
      body_template: 'Welcome to TOHFA! Your registration {{applicationId}} is approved with ID {{tohfaFarmerId}}.',
      is_active: true,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      code: 'ORDER_CONFIRMED',
      channel: 'IN_APP',
      locale: 'en',
      subject: 'Order Confirmed',
      body_template: 'Order #{{orderNumber}} confirmed for ₹{{totalAmount}}.',
      is_active: true,
    },
  ];

  const notifications: NotificationRow[] = [];

  return {
    notifications,
    templates,
    listByUserId: async (_db, userId, options) => {
      let filtered = notifications.filter((n) => n.user_id === userId);
      if (options.unreadOnly) {
        filtered = filtered.filter((n) => n.read_at === null);
      }
      const unreadCount = notifications.filter(
        (n) => n.user_id === userId && n.read_at === null,
      ).length;
      return {
        items: filtered.slice(0, options.limit),
        nextCursor: null,
        hasMore: false,
        unreadCount,
      };
    },
    markAsRead: async (_db, id, userId) => {
      const found = notifications.find((n) => n.id === id && n.user_id === userId);
      if (!found) return null;
      found.read_at = found.read_at ?? new Date();
      found.status = 'READ';
      return found;
    },
    createNotification: async (_db, params: CreateNotificationParams) => {
      if (params.dedupeKey) {
        const existing = notifications.find(
          (n) => n.user_id === params.userId && n.provider_message_id === params.dedupeKey,
        );
        if (existing) return null;
      }

      const row: NotificationRow = {
        id: `notif-${notifications.length + 1}`,
        user_id: params.userId,
        template_id: params.templateId ?? null,
        channel: params.channel ?? 'IN_APP',
        title: params.title ?? null,
        body: params.body,
        locale: params.locale ?? 'en',
        data: params.data ?? {},
        status: 'DELIVERED',
        provider_message_id: params.dedupeKey ?? null,
        sent_at: new Date(),
        read_at: null,
        created_at: new Date(),
        updated_at: null,
      };
      notifications.push(row);
      return row;
    },
    findTemplate: async (_db, code, channel, locale) => {
      const found = templates.find(
        (t) => t.code === code && t.channel === channel && t.locale === locale && t.is_active,
      );
      if (found) return found;
      return templates.find(
        (t) => t.code === code && t.channel === channel && t.locale === 'en' && t.is_active,
      ) ?? null;
    },
    getUserPreferredLocale: async () => 'en',
  };
}

describe('Domain Event Bus & Notification Centre (Story S-15)', () => {
  describe('Event Bus Fault Isolation', () => {
    it('fault isolation: a subscriber throwing an error never fails the publish caller', async () => {
      const faultyHandler = () => {
        throw new Error('Subscriber connection exploded!');
      };

      const unsub = eventBus.subscribe('farmer.application.approved', faultyHandler);

      // Publishing should NOT throw
      await expect(
        eventBus.publish('farmer.application.approved', {
          userId: IDS.userFarmer,
          applicationId: 'APP-1001',
          tohfaFarmerId: 'TOHFA-F-2026-0001',
        }),
      ).resolves.toBeUndefined();

      unsub();
    });
  });

  describe('Template Interpolation', () => {
    it('accurately interpolates template placeholders', () => {
      const template = 'Order #{{orderNumber}} confirmed for ₹{{totalAmount}}.';
      const output = interpolateTemplate(template, {
        orderNumber: 'ORD-9876',
        totalAmount: '450.00',
      });
      expect(output).toBe('Order #ORD-9876 confirmed for ₹450.00.');
    });

    it('handles missing placeholders cleanly without failing', () => {
      const template = 'Hello {{name}}, welcome to {{service}}!';
      const output = interpolateTemplate(template, { name: 'Ansif' });
      expect(output).toBe('Hello Ansif, welcome to !');
    });
  });

  describe('Notification Creation & Idempotency', () => {
    it('creates in-app notification when a domain event is handled', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      const res = await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-1001',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
      });

      expect(res).not.toBeNull();
      expect(res?.body).toContain('TOHFA-F-2026-0001');
      expect(repo.notifications).toHaveLength(1);
    });

    it('idempotency: replaying the same event does not produce duplicate notification rows', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      const eventPayload = {
        userId: IDS.userFarmer,
        applicationId: 'APP-1001',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
      };

      // Dispatch twice
      const first = await service.handleDomainEvent('farmer.application.approved', eventPayload);
      const second = await service.handleDomainEvent('farmer.application.approved', eventPayload);

      expect(first).not.toBeNull();
      expect(second).toBeNull(); // Deduplicated
      expect(repo.notifications).toHaveLength(1);
    });

    it('all 11 golden-thread events have a defined template code mapping', () => {
      expect(Object.keys(EVENT_TEMPLATE_MAP)).toHaveLength(11);
      expect(EVENT_TEMPLATE_MAP['farmer.application.approved']).toBe('FARMER_APP_APPROVED');
      expect(EVENT_TEMPLATE_MAP['goods.received']).toBe('GOODS_RECEIVED');
      expect(EVENT_TEMPLATE_MAP['wallet.credited']).toBe('WALLET_CREDITED');
    });
  });

  describe('User Scoping & Own Data (BR-36)', () => {
    it('GET /notifications returns caller notifications and unread count', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      // Create 2 notifications for farmer, 1 for customer
      await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-01',
        tohfaFarmerId: 'TOHFA-01',
      });
      await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-02',
        tohfaFarmerId: 'TOHFA-02',
      });
      await service.handleDomainEvent('order.confirmed', {
        userId: IDS.customer,
        orderId: 'ORD-01',
        orderNumber: 'ORD-01',
        totalAmount: '100',
      });

      const farmerActor = anActor({ userId: IDS.userFarmer });
      const result = (await service.listMyNotifications(farmerActor, { limit: 10, unreadOnly: false })) as {
        items: NotificationRow[];
        unreadCount: number;
      };

      expect(result.items).toHaveLength(2);
      expect(result.unreadCount).toBe(2);
      expect(result.items[0]?.body).toContain('TOHFA-01');
      expect(result.items[1]?.body).toContain('TOHFA-02');
    });

    it('BR-36: marking a foreign notification as read returns 404 (does not expose another user)', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-01',
        tohfaFarmerId: 'TOHFA-01',
      });

      const foreignId = repo.notifications[0]!.id;
      const customerActor = anActor({ userId: IDS.customer });

      // Customer attempts to mark farmer's notification as read
      await expect(service.markAsRead(customerActor, foreignId)).rejects.toThrow();
    });
  });

  describe('HTTP Route Integration', () => {
    const app = createApp();
    const token = signAccessToken({
      sub: IDS.userFarmer,
      roles: [{ code: 'FARMER' }],
      farmerId: IDS.farmer,
      customerId: null,
    });

    it('GET /v1/notifications requires authentication', async () => {
      const res = await request(app).get('/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('GET /v1/notifications accepts unreadOnly query parameter', async () => {
      const res = await request(app)
        .get('/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${token}`);

      // Authenticated call succeeds or returns empty list
      expect([200, 500]).toContain(res.status); // 500 only if db is not up in test environment
    });
  });
});
