import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ─────────────────────────────────────────────
export const memberRoleEnum = pgEnum("member_role", ["admin", "member"]);
export const eventTypeEnum = pgEnum("event_type", [
  "wedding",
  "housewarming",
  "festival",
  "funeral",
  "custom",
]);
export const eventStatusEnum = pgEnum("event_status", ["open", "closed"]);
export const moiDirectionEnum = pgEnum("moi_direction", ["given", "received"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "event_reminder",
  "pending_return",
  "family_invite",
  "general",
]);

// ─── Users ─────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Families ──────────────────────────────────────────
export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  inviteCode: text("invite_code").notNull().unique(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Memberships ───────────────────────────────────────
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_user_family").on(table.userId, table.familyId),
  ]
);

// ─── Events ────────────────────────────────────────────
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: eventTypeEnum("type").notNull().default("custom"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    location: text("location"),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: eventStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_events_family").on(table.familyId),
    index("idx_events_date").on(table.date),
    index("idx_events_created_at").on(table.createdAt),
    index("idx_events_status").on(table.status),
  ]
);

// ─── Moi Transactions ────────────────────────────────
export const moiTransactions = pgTable(
  "moi_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    contributorName: text("contributor_name").notNull(),
    amount: integer("amount").notNull(),
    notes: text("notes"),
    paidStatus: boolean("paid_status").notNull().default(false),
    direction: moiDirectionEnum("direction").notNull().default("received"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_transactions_event").on(table.eventId),
    index("idx_transactions_family").on(table.familyId),
    index("idx_transactions_contributor").on(table.contributorName),
    index("idx_transactions_date").on(table.createdAt),
    index("idx_transactions_direction").on(table.direction),
  ]
);

// ─── Contribution History ─────────────────────────────
export const contributionHistory = pgTable(
  "contribution_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    personName: text("person_name").notNull(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => moiTransactions.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    direction: moiDirectionEnum("direction").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("idx_history_family").on(table.familyId),
    index("idx_history_person").on(table.personName),
  ]
);

// ─── Notifications ─────────────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").references(() => families.id, {
      onDelete: "cascade",
    }),
    type: notificationTypeEnum("type").notNull().default("general"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId),
  ]
);

// ─── Favorite Events ───────────────────────────────────
export const favoriteEvents = pgTable(
  "favorite_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_user_event_favorite").on(table.userId, table.eventId),
  ]
);

// ─── Relations ─────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  notifications: many(notifications),
  favorites: many(favoriteEvents),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  creator: one(users, { fields: [families.createdBy], references: [users.id] }),
  memberships: many(memberships),
  events: many(events),
  transactions: many(moiTransactions),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  family: one(families, { fields: [memberships.familyId], references: [families.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  family: one(families, { fields: [events.familyId], references: [families.id] }),
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
  transactions: many(moiTransactions),
}));

export const moiTransactionsRelations = relations(moiTransactions, ({ one }) => ({
  event: one(events, { fields: [moiTransactions.eventId], references: [events.id] }),
  family: one(families, { fields: [moiTransactions.familyId], references: [families.id] }),
  creator: one(users, { fields: [moiTransactions.createdBy], references: [users.id] }),
}));

export const contributionHistoryRelations = relations(contributionHistory, ({ one }) => ({
  family: one(families, { fields: [contributionHistory.familyId], references: [families.id] }),
  event: one(events, { fields: [contributionHistory.eventId], references: [events.id] }),
  transaction: one(moiTransactions, {
    fields: [contributionHistory.transactionId],
    references: [moiTransactions.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  family: one(families, { fields: [notifications.familyId], references: [families.id] }),
}));

export const favoriteEventsRelations = relations(favoriteEvents, ({ one }) => ({
  user: one(users, { fields: [favoriteEvents.userId], references: [users.id] }),
  event: one(events, { fields: [favoriteEvents.eventId], references: [events.id] }),
}));
