import type { Executor } from '../../db/pool.js';

export interface NotificationRow {
  id: string;
  user_id: string;
  template_id: string | null;
  channel: 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';
  title: string | null;
  body: string;
  locale: 'en' | 'ta';
  data: Record<string, unknown>;
  status: string;
  provider_message_id: string | null;
  sent_at: Date | null;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface NotificationTemplateRow {
  id: string;
  code: string;
  channel: string;
  locale: 'en' | 'ta';
  subject: string | null;
  body_template: string;
  is_active: boolean;
}

export interface CreateNotificationParams {
  userId: string;
  templateId?: string | undefined;
  channel?: 'IN_APP' | 'PUSH' | 'SMS' | 'EMAIL' | undefined;
  title?: string | null | undefined;
  body: string;
  locale?: 'en' | 'ta' | undefined;
  data?: Record<string, unknown> | undefined;
  dedupeKey?: string | undefined;
}

export interface ListNotificationsOptions {
  limit: number;
  cursor?: string | undefined;
  unreadOnly?: boolean | undefined;
}

export interface NotificationsRepo {
  listByUserId(
    db: Executor,
    userId: string,
    options: ListNotificationsOptions,
  ): Promise<{ items: NotificationRow[]; nextCursor: string | null; hasMore: boolean; unreadCount: number }>;
  markAsRead(db: Executor, id: string, userId: string): Promise<NotificationRow | null>;
  createNotification(db: Executor, params: CreateNotificationParams): Promise<NotificationRow | null>;
  findTemplate(db: Executor, code: string, channel: string, locale: 'en' | 'ta'): Promise<NotificationTemplateRow | null>;
  getUserPreferredLocale(db: Executor, userId: string): Promise<'en' | 'ta'>;
}

export const notificationsRepo: NotificationsRepo = {
  async listByUserId(db, userId, options) {
    const unreadClause = options.unreadOnly ? `AND read_at IS NULL` : '';
    const values: unknown[] = [userId, options.limit + 1];
    let cursorClause = '';

    if (options.cursor !== undefined && options.cursor.length > 0) {
      values.push(options.cursor);
      cursorClause = `AND id < $3`;
    }

    const itemsResult = await db.query<NotificationRow>(
      `SELECT id, user_id, template_id, channel, title, body, locale, data,
              status, provider_message_id, sent_at, read_at, created_at, updated_at
         FROM notifications
        WHERE user_id = $1
              ${unreadClause}
              ${cursorClause}
        ORDER BY created_at DESC, id DESC
        LIMIT $2`,
      values,
    );

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM notifications
        WHERE user_id = $1 AND read_at IS NULL`,
      [userId],
    );

    const hasMore = itemsResult.rows.length > options.limit;
    const items = hasMore ? itemsResult.rows.slice(0, options.limit) : itemsResult.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;
    const unreadCount = Number(countResult.rows[0]?.count ?? '0');

    return { items, nextCursor, hasMore, unreadCount };
  },

  async markAsRead(db, id, userId) {
    const result = await db.query<NotificationRow>(
      `UPDATE notifications
          SET read_at = COALESCE(read_at, now()),
              status = 'READ',
              updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, template_id, channel, title, body, locale, data,
                  status, provider_message_id, sent_at, read_at, created_at, updated_at`,
      [id, userId],
    );
    return result.rows[0] ?? null;
  },

  async createNotification(db, params) {
    // Idempotent delivery: if dedupeKey is provided, check if already exists
    if (params.dedupeKey !== undefined && params.dedupeKey.length > 0) {
      const existing = await db.query<{ id: string }>(
        `SELECT id FROM notifications
          WHERE user_id = $1 AND provider_message_id = $2
          LIMIT 1`,
        [params.userId, params.dedupeKey],
      );
      if (existing.rows.length > 0) {
        return null; // Already delivered (idempotent replay)
      }
    }

    const result = await db.query<NotificationRow>(
      `INSERT INTO notifications (
         user_id, template_id, channel, title, body, locale, data,
         status, provider_message_id, sent_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'DELIVERED', $8, now())
       RETURNING id, user_id, template_id, channel, title, body, locale, data,
                 status, provider_message_id, sent_at, read_at, created_at, updated_at`,
      [
        params.userId,
        params.templateId ?? null,
        params.channel ?? 'IN_APP',
        params.title ?? null,
        params.body,
        params.locale ?? 'en',
        JSON.stringify(params.data ?? {}),
        params.dedupeKey ?? null,
      ],
    );

    return result.rows[0]!;
  },

  async findTemplate(db, code, channel, locale) {
    const result = await db.query<NotificationTemplateRow>(
      `SELECT id, code, channel, locale, subject, body_template, is_active
         FROM notification_templates
        WHERE code = $1 AND channel = $2 AND locale = $3 AND is_active = true
        LIMIT 1`,
      [code, channel, locale],
    );

    if (result.rows[0] !== undefined) {
      return result.rows[0];
    }

    // Fallback to English if Tamil template not found
    if (locale !== 'en') {
      const fallback = await db.query<NotificationTemplateRow>(
        `SELECT id, code, channel, locale, subject, body_template, is_active
           FROM notification_templates
          WHERE code = $1 AND channel = $2 AND locale = 'en' AND is_active = true
          LIMIT 1`,
        [code, channel],
      );
      return fallback.rows[0] ?? null;
    }

    return null;
  },

  async getUserPreferredLocale(db, userId) {
    const result = await db.query<{ preferred_locale: 'en' | 'ta' }>(
      `SELECT preferred_locale FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    return result.rows[0]?.preferred_locale ?? 'en';
  },
};
