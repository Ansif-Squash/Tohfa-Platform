import { z } from 'zod';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);
const quantitySchema = z.string().regex(/^[0-9]{1,9}(\.[0-9]{1,3})?$/);

export const produceGrades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type ProduceGrade = (typeof produceGrades)[number];
export const gradeSchema = z.enum(produceGrades);

export const cartStatuses = ['ACTIVE', 'LOCKED', 'CONVERTED', 'EXPIRED'] as const;
export type CartStatus = (typeof cartStatuses)[number];

export const cartItemStatuses = ['HELD', 'RELEASED', 'CONVERTED', 'EXPIRED'] as const;
export type CartItemStatus = (typeof cartItemStatuses)[number];

export const cartItemCreateSchema = z.object({
  productId: z.string().uuid(),
  grade: gradeSchema.default('GRADE_1'),
  qtyKg: quantitySchema,
  warehouseId: z.string().uuid().optional(),
});
export type CartItemCreateInput = {
  productId: string;
  grade?: ProduceGrade | undefined;
  qtyKg: string;
  warehouseId?: string | undefined;
};

export const cartReplaceSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  items: z.array(cartItemCreateSchema),
});
export type CartReplaceInput = {
  warehouseId?: string | undefined;
  items: CartItemCreateInput[];
};

export const cartItemResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string(),
  grade: gradeSchema,
  qtyKg: quantitySchema,
  unitPrice: moneySchema,
  lineTotal: moneySchema,
  certificationBadges: z.array(z.string()).optional(),
});
export type CartItemResponse = z.infer<typeof cartItemResponseSchema>;

export const cartResponseSchema = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid().nullable(),
  status: z.enum(cartStatuses),
  items: z.array(cartItemResponseSchema),
  subtotal: moneySchema,
  lockedAt: z.string().nullable(),
  lockExpiresAt: z.string().nullable(),
});
export type CartResponse = z.infer<typeof cartResponseSchema>;
