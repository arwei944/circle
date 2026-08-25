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

export interface ApiErrorBody {
   code: string;
   message: string;
   details: unknown[];
   trace_id: string;
}

export function apiError(code: string, message: string): ApiErrorBody {
   return { code, message, details: [], trace_id: crypto.randomUUID() };
}
