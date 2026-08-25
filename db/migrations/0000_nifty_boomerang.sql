CREATE TABLE `cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`team_id` text DEFAULT 'CORE' NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issue_labels` (
	`issue_id` text NOT NULL,
	`label_id` text NOT NULL,
	PRIMARY KEY(`issue_id`, `label_id`),
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status_id` text DEFAULT 'backlog' NOT NULL,
	`priority_id` text DEFAULT 'no-priority' NOT NULL,
	`assignee_id` text,
	`project_id` text,
	`cycle_id` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`due_date` integer,
	`rank` text NOT NULL,
	`subissues` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `issues_identifier_unique` ON `issues` (`identifier`);--> statement-breakpoint
CREATE TABLE `labels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon_index` integer DEFAULT 0 NOT NULL,
	`color` text DEFAULT '#8f9299' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status_id` text DEFAULT 'to-do' NOT NULL,
	`health` text DEFAULT 'no-update' NOT NULL,
	`priority` text DEFAULT 'no-priority' NOT NULL,
	`lead_id` text,
	`start_date` text,
	`target_date` text,
	`percent_complete` integer DEFAULT 0 NOT NULL,
	`team_id` text DEFAULT 'CORE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar_url` text NOT NULL,
	`timezone` text NOT NULL,
	`status` text DEFAULT 'online' NOT NULL,
	`role` text DEFAULT 'Member' NOT NULL,
	`joined_date` text NOT NULL,
	`team_ids` text DEFAULT '[]' NOT NULL
);
