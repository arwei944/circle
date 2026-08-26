import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   email: text('email').notNull(),
   avatarUrl: text('avatar_url').notNull(),
   timezone: text('timezone').notNull(),
   status: text('status').notNull().default('online'),
   role: text('role').notNull().default('Member'),
   joinedDate: text('joined_date').notNull(),
   teamIds: text('team_ids', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
});

export const labels = sqliteTable('labels', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   color: text('color').notNull(),
});

export const projects = sqliteTable('projects', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   iconIndex: integer('icon_index').notNull().default(0),
   color: text('color').notNull().default('#8f9299'),
   description: text('description').notNull().default(''),
   statusId: text('status_id').notNull().default('to-do'),
   health: text('health').notNull().default('no-update'),
   priority: text('priority').notNull().default('no-priority'),
   leadId: text('lead_id'),
   startDate: text('start_date'),
   targetDate: text('target_date'),
   initiative: text('initiative'),
   percentComplete: integer('percent_complete').notNull().default(0),
   teamId: text('team_id').notNull().default('CORE'),
});

export const cycles = sqliteTable('cycles', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   teamId: text('team_id').notNull().default('CORE'),
   status: text('status').notNull().default('planned'),
   startDate: text('start_date').notNull(),
   endDate: text('end_date').notNull(),
   capacity: integer('capacity').notNull().default(100),
});

export const issues = sqliteTable('issues', {
   id: text('id').primaryKey(),
   identifier: text('identifier').notNull().unique(),
   title: text('title').notNull(),
   description: text('description').notNull().default(''),
   statusId: text('status_id').notNull().default('backlog'),
   priorityId: text('priority_id').notNull().default('no-priority'),
   assigneeId: text('assignee_id'),
   projectId: text('project_id'),
   cycleId: text('cycle_id').notNull().default(''),
   createdAt: integer('created_at').notNull(),
   dueDate: integer('due_date'),
   completedAt: integer('completed_at'),
   rank: text('rank').notNull(),
   subissues: text('subissues', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
});

export const issueLabels = sqliteTable(
   'issue_labels',
   {
      issueId: text('issue_id')
         .notNull()
         .references(() => issues.id, { onDelete: 'cascade' }),
      labelId: text('label_id')
         .notNull()
         .references(() => labels.id, { onDelete: 'cascade' }),
   },
   (t) => [primaryKey({ columns: [t.issueId, t.labelId] })]
);

export const projectUpdates = sqliteTable('project_updates', {
   id: text('id').primaryKey(),
   projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
   message: text('message').notNull(),
   health: text('health').notNull().default('no-update'),
   authorId: text('author_id'),
   createdAt: integer('created_at').notNull(),
});

export const projectLabels = sqliteTable(
   'project_labels',
   {
      projectId: text('project_id')
         .notNull()
         .references(() => projects.id, { onDelete: 'cascade' }),
      labelId: text('label_id')
         .notNull()
         .references(() => labels.id, { onDelete: 'cascade' }),
   },
   (t) => [primaryKey({ columns: [t.projectId, t.labelId] })]
);

export const teams = sqliteTable('teams', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   icon: text('icon').notNull().default(''),
   color: text('color').notNull().default('#8f9299'),
   joined: integer('joined').notNull().default(1),
});

export type IssueRow = typeof issues.$inferSelect;
export type NewIssueRow = typeof issues.$inferInsert;
export type ProjectRow = typeof projects.$inferSelect;
export type ProjectUpdateRow = typeof projectUpdates.$inferSelect;
export type ProjectLabelRow = typeof projectLabels.$inferSelect;
export type TeamRow = typeof teams.$inferSelect;
