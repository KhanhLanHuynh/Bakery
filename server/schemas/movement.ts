import { z } from 'zod'

export const movementTypeSchema = z.enum(['in', 'out', 'adjustment'])
export const movementReasonSchema = z.enum(['purchase', 'bake', 'waste', 'correction', 'other'])

export const movementSchema = z.object({
  id: z.string(),
  ingredientId: z.string(),
  type: movementTypeSchema,
  quantity: z.number().positive(),
  date: z.string(),
  reason: movementReasonSchema,
  expiryDate: z.string().nullable(),
  referenceId: z.string().nullable(),
  note: z.string(),
  createdAt: z.string(),
})

export const createMovementSchema = z
  .object({
    ingredientId: z.string().min(1),
    type: movementTypeSchema,
    quantity: z.number().positive('Quantity must be greater than 0'),
    targetQuantity: z.number().min(0).optional(),
    date: z.string().min(1, 'Date is required'),
    reason: movementReasonSchema,
    expiryDate: z.string().nullable().optional(),
    referenceId: z.string().nullable().optional(),
    note: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'adjustment') {
      if (data.targetQuantity === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Target quantity is required for adjustments',
          path: ['targetQuantity'],
        })
      }
      if (!data.note?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Note is required for adjustments',
          path: ['note'],
        })
      }
      if (data.reason !== 'correction') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Adjustments must use the correction reason',
          path: ['reason'],
        })
      }
    }

    if (data.type !== 'in' && data.expiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expiry date is only allowed on stock-in movements',
        path: ['expiryDate'],
      })
    }
  })

export type Movement = z.infer<typeof movementSchema>
export type CreateMovementInput = z.infer<typeof createMovementSchema>
export type MovementType = z.infer<typeof movementTypeSchema>
export type MovementReason = z.infer<typeof movementReasonSchema>
