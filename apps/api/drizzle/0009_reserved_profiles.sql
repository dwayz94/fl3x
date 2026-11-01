ALTER TABLE "users" ADD COLUMN "reserved_for" text;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "signed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "users_reserved_for_idx" ON "users" USING btree ("reserved_for");