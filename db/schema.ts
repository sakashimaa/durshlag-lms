import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: varchar("image", { length: 2048 }).default(""),

  role: varchar("role", { length: 255 }).default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason").default(""),
  banExpires: timestamp("ban_expires"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 255 }).default(""),
  userAgent: text("user_agent").default(""),

  impersonatedBy: varchar("impersonated_by", { length: 255 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accessToken: text("access_token").default(""),
  refreshToken: text("refresh_token").default(""),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope").default(""),
  idToken: text("id_token").default(""),
  password: text("password").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: varchar("id", { length: 255 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const levelEnum = pgEnum("level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const statusEnum = pgEnum("status", ["draft", "published", "archived"]);

export const course = pgTable("course", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title", { length: 255 }).notNull(),
  description: jsonb("description").notNull(),
  fileKey: varchar("file_key", { length: 255 }).notNull(),
  price: integer("price").notNull(),
  duration: integer("duration").notNull(),
  level: levelEnum("level").default("beginner"),
  category: varchar("category", { length: 255 }).notNull(),
  smallDescription: varchar("small_description", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  status: statusEnum("status").default("draft"),

  // relations
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chapter = pgTable("chapter", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title", { length: 255 }).notNull(),
  position: integer("position").notNull(),

  courseId: uuid("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lesson = pgTable("lesson", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title", { length: 255 }).notNull(),
  description: jsonb("description"),
  thumbnailKey: varchar("thumbnail_url", { length: 255 }),
  videoKey: varchar("video_url", { length: 255 }),

  position: integer("position").notNull(),

  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapter.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// user relations
export const usersRelations = relations(user, ({ many }) => ({
  courses: many(course),
}));

// chapter relations
export const chaptersRelations = relations(chapter, ({ one, many }) => ({
  course: one(course, {
    fields: [chapter.courseId],
    references: [course.id],
  }),
  lessons: many(lesson),
}));

// lesson relations
export const lessonsRelations = relations(lesson, ({ one }) => ({
  chapter: one(chapter, {
    fields: [lesson.chapterId],
    references: [chapter.id],
  }),
}));

// course relations
export const coursesRelations = relations(course, ({ one, many }) => ({
  user: one(user, {
    fields: [course.userId],
    references: [user.id],
  }),
  chapters: many(chapter),
}));
