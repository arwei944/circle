CREATE TABLE `project_labels` (
	`project_id` text NOT NULL,
	`label_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `label_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`message` text NOT NULL,
	`health` text DEFAULT 'no-update' NOT NULL,
	`author_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT '' NOT NULL,
	`color` text DEFAULT '#8f9299' NOT NULL,
	`joined` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `cycles` ADD `capacity` integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `issues` ADD `completed_at` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `initiative` text;