CREATE TABLE `shows` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`premise` text NOT NULL,
	`owner` text NOT NULL,
	`start` integer NOT NULL,
	`duration` integer NOT NULL,
	`token_hash` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`minute` integer PRIMARY KEY NOT NULL,
	`show_id` text NOT NULL,
	FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON UPDATE no action ON DELETE no action
);
