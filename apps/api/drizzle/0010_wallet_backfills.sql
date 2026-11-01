CREATE TABLE "wallet_backfills" (
	"wallet" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"from_at" timestamp with time zone,
	"points" integer DEFAULT 0 NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL
);
