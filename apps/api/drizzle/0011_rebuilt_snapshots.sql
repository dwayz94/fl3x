ALTER TABLE "wallet_snapshots" ADD COLUMN "rebuilt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "wallet_snapshots" SET "rebuilt" = true WHERE "wallet" IN (SELECT "wallet" FROM "wallet_backfills") AND date_part('minute', "taken_at") = 0 AND date_part('second', "taken_at") = 0;
