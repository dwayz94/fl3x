ALTER TABLE "media" ALTER COLUMN "bytes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "stored" text DEFAULT 'db' NOT NULL;