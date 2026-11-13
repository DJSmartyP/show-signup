import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const shows = sqliteTable('shows', { id: text('id').primaryKey(), title: text('title').notNull(), premise: text('premise').notNull(), owner: text('owner').notNull(), start: integer('start').notNull(), duration: integer('duration').notNull(), tokenHash: text('token_hash').notNull() });
export const slots = sqliteTable('slots', { minute: integer('minute').primaryKey(), showId: text('show_id').notNull().references(()=>shows.id) });
