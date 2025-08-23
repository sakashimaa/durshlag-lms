ALTER TABLE "account" ALTER COLUMN "access_token_expires_at" SET DEFAULT '2025-08-22 14:57:57.334';--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "refresh_token_expires_at" SET DEFAULT '2025-08-22 14:57:57.334';--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN "description" text NOT NULL;