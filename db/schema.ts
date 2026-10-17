import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const celebrations = sqliteTable("celebrations", {
  id: text("id").primaryKey(), owner: text("owner").notNull(), slug: text("slug").notNull().unique(),
  title: text("title").notNull(), occasion: text("occasion").notNull(), date: text("date").notNull().default(""),
  message: text("message").notNull().default(""), currency: text("currency").notNull().default("USD"),
  visibility: text("visibility").notNull().default("unlisted"), theme: text("theme").notNull().default("peach"),
  created: integer("created").notNull(),
}, t => [index("celebrations_owner_idx").on(t.owner)]);

export const wishes = sqliteTable("wishes", {
  id: text("id").primaryKey(), celebrationId: text("celebration_id").notNull().references(() => celebrations.id),
  title: text("title").notNull(), note: text("note").notNull().default(""), kind: text("kind").notNull().default("product"),
  category: text("category").notNull().default("Other"), price: integer("price"), url: text("url").notNull().default(""),
  image: text("image").notNull().default(""), priority: integer("priority").notNull().default(0),
  art: text("art").notNull().default("gift"), position: integer("position").notNull().default(0),
  paused: integer("paused").notNull().default(0), state: text("state").notNull().default("available"),
  token: text("token"), expires: integer("expires"), extended: integer("extended").notNull().default(0),
}, t => [index("wishes_celebration_idx").on(t.celebrationId)]);
