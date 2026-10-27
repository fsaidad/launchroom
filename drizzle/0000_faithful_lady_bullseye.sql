CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `request_events` ON `events` (`request_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`brief` text NOT NULL,
	`status` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_idempotency` ON `requests` (`workspace`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `workspace_created` ON `requests` (`workspace`,`created_at`);