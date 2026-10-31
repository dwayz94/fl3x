CREATE TABLE "wallet_grants" (
	"address" text PRIMARY KEY NOT NULL,
	"tier" text DEFAULT 'premium' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
