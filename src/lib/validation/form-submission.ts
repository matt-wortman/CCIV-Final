import { SubmissionStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

const jsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
);

const rowVersionSchema = z
  .object({
    technologyRowVersion: z.number().int().nonnegative().optional(),
    triageStageRowVersion: z.number().int().nonnegative().optional(),
    viabilityStageRowVersion: z.number().int().nonnegative().optional(),
  })
  .partial()
  .optional();

export const formSubmissionPayloadSchema = z.object({
  templateId: z.string().min(1, 'templateId is required'),
  responses: z.record(z.string(), jsonValueSchema).default({}),
  repeatGroups: z
    .record(z.string(), z.array(z.record(z.string(), jsonValueSchema)))
    .default({}),
  calculatedScores: z
    .record(z.string(), jsonValueSchema)
    .optional()
    .default({}),
  rowVersions: rowVersionSchema,
});

export const formSubmissionRequestSchema = formSubmissionPayloadSchema.extend({
  submittedBy: z.string().min(1).optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
});

export const formSubmissionUpdateSchema = formSubmissionPayloadSchema.extend({
  submissionId: z.string().min(1, 'submissionId is required'),
  status: z.nativeEnum(SubmissionStatus).optional(),
});

export type FormSubmissionPayload = z.infer<typeof formSubmissionPayloadSchema>;
export type FormSubmissionRequest = z.infer<typeof formSubmissionRequestSchema>;
export type FormSubmissionUpdate = z.infer<typeof formSubmissionUpdateSchema>;
