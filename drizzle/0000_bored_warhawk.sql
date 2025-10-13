CREATE TABLE `attribute_values` (
	`id` text PRIMARY KEY NOT NULL,
	`observation_id` text NOT NULL,
	`attribute_id` text NOT NULL,
	`value_text` text,
	FOREIGN KEY (`observation_id`) REFERENCES `observations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attributes` (
	`id` text PRIMARY KEY NOT NULL,
	`object_type_id` text NOT NULL,
	`label` text NOT NULL,
	`key` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`object_type_id`) REFERENCES `object_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `object_types` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `observations` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`object_type_id` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`captured_at` integer NOT NULL,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `survey_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`object_type_id`) REFERENCES `object_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `survey_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
