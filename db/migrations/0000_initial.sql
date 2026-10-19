CREATE TABLE "celebrations" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"occasion" text NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"visibility" text DEFAULT 'unlisted' NOT NULL,
	"theme" text DEFAULT 'peach' NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "celebrations_slug_unique" UNIQUE("slug")
);


CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"content_type" text NOT NULL,
	"created" bigint NOT NULL
);


CREATE TABLE "wishes" (
	"id" text PRIMARY KEY NOT NULL,
	"celebration_id" text NOT NULL,
	"title" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'product' NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"price" integer,
	"url" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"art" text DEFAULT 'gift' NOT NULL,
	"position" bigint DEFAULT 0 NOT NULL,
	"paused" integer DEFAULT 0 NOT NULL,
	"state" text DEFAULT 'available' NOT NULL,
	"token" text,
	"expires" bigint,
	"extended" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "wishes" ADD CONSTRAINT "wishes_celebration_id_celebrations_id_fk" FOREIGN KEY ("celebration_id") REFERENCES "public"."celebrations"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "celebrations_owner_idx" ON "celebrations" USING btree ("owner");

CREATE INDEX "images_owner_idx" ON "images" USING btree ("owner");

CREATE INDEX "wishes_celebration_idx" ON "wishes" USING btree ("celebration_id");
