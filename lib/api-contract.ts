import { z } from 'zod';

export const createIssueSchema = z
   .object({
      title: z.string().trim().min(1).max(500),
      description: z.string().max(20000).optional().default(''),
      statusId: z.string().optional(),
      priorityId: z.string().optional(),
      assigneeId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
      cycleId: z.string().nullable().optional(),
      dueDate: z.number().int().nullable().optional(),
      labels: z.array(z.string()).optional().default([]),
   })
   .strip();

export const updateIssueSchema = z
   .object({
      title: z.string().trim().min(1).max(500).optional(),
      description: z.string().max(20000).optional(),
      statusId: z.string().optional(),
      priorityId: z.string().optional(),
      assigneeId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
      cycleId: z.string().nullable().optional(),
      dueDate: z.number().int().nullable().optional(),
      labels: z.array(z.string()).optional(),
      rank: z
         .object({
            beforeIssueId: z.string().optional(),
            afterIssueId: z.string().optional(),
         })
         .strip()
         .optional(),
   })
   .strip()
   .refine((v) => Object.keys(v).length > 0, { message: 'empty update' });

export const createProjectSchema = z
   .object({
      name: z.string().trim().min(1).max(200),
      iconIndex: z.number().int().min(0).optional(),
      color: z.string().optional(),
      description: z.string().max(4000).optional().default(''),
      statusId: z.string().optional(),
      priority: z.string().optional(),
      health: z.string().optional(),
      leadId: z.string().nullable().optional(),
      startDate: z.string().nullable().optional(),
      targetDate: z.string().nullable().optional(),
      teamId: z.string().optional(),
      initiative: z.string().nullable().optional(),
      labels: z.array(z.string()).optional().default([]),
   })
   .strip();
export const updateProjectSchema = createProjectSchema
   .partial()
   .strip()
   .refine((v) => Object.keys(v).length > 0, { message: 'empty update' });
export const createProjectUpdateSchema = z
   .object({
      message: z.string().trim().min(1).max(4000),
      health: z.string().optional().default('no-update'),
   })
   .strip();

export const createCycleSchema = z
   .object({
      name: z.string().trim().min(1).max(200),
      teamId: z.string().optional(),
      status: z.enum(['planned', 'upcoming', 'current', 'completed']).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid date'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid date'),
      capacity: z.number().int().min(0).max(1000).optional(),
   })
   .strip();
export const updateCycleSchema = createCycleSchema
   .partial()
   .strip()
   .refine((v) => Object.keys(v).length > 0, { message: 'empty update' });

export interface ApiErrorBody {
   code: string;
   message: string;
   details: unknown[];
   trace_id: string;
}

export function apiError(code: string, message: string): ApiErrorBody {
   return { code, message, details: [], trace_id: crypto.randomUUID() };
}
