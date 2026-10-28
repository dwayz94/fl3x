CREATE TABLE "data_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"label" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"target" text,
	"visitor_hash" text NOT NULL,
	"country" text,
	"device" text NOT NULL,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet" text NOT NULL,
	"value_usd" double precision NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_reactions" (
	"widget_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "widget_reactions_widget_id_emoji_pk" PRIMARY KEY("widget_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "badges" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_events" ADD CONSTRAINT "profile_events_profile_user_id_users_id_fk" FOREIGN KEY ("profile_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_reactions" ADD CONSTRAINT "widget_reactions_widget_id_widgets_id_fk" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "links_user_idx" ON "links" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "profile_events_user_time_idx" ON "profile_events" USING btree ("profile_user_id","created_at");--> statement-breakpoint
CREATE INDEX "wallet_snapshots_wallet_time_idx" ON "wallet_snapshots" USING btree ("wallet","taken_at");