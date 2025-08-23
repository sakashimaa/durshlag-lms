ALTER TABLE "account" ALTER COLUMN "access_token_expires_at" SET DEFAULT '2025-08-23 13:40:06.885';--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "refresh_token_expires_at" SET DEFAULT '2025-08-23 13:40:06.885';--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" varchar(255) DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;