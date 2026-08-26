import { z } from 'zod';

export const notificationIdParam = z.object({
  id: z.string().uuid(),
});
export type NotificationIdParam = z.infer<typeof notificationIdParam>;

export const listNotificationsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;

export const notificationResponse = z.object({
  id: z.string().uuid(),
  channel: z.enum(['PUSH', 'SMS', 'EMAIL', 'IN_APP']),
  title: z.string().nullable(),
  body: z.string(),
  locale: z.enum(['en', 'ta']),
  data: z.record(z.unknown()),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type NotificationResponse = z.infer<typeof notificationResponse>;
