import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const analyticsEvents=sqliteTable('analytics_events',{
  id:text('id').primaryKey(),
  visitor:text('visitor').notNull(),
  route:text('route').notNull(),
  createdAt:integer('created_at').notNull(),
},table=>[
  index('analytics_events_created_at').on(table.createdAt),
  index('analytics_events_visitor_created_at').on(table.visitor,table.createdAt),
]);
export const analyticsMeta=sqliteTable('analytics_meta',{
  id:integer('id').primaryKey(),startedAt:integer('started_at').notNull(),
});
export const questSessions=sqliteTable('quest_sessions',{id:text('id').primaryKey(),expiresAt:integer('expires_at').notNull()});
export const questSubmissions=sqliteTable('quest_submissions',{
  id:text('id').primaryKey(),sessionId:text('session_id').notNull(),address:text('address').notNull().unique(),postId:text('post_id').notNull().unique(),postUrl:text('post_url').notNull(),xUsername:text('x_username').notNull(),apiStatus:text('api_status').notNull(),manualStatus:text('manual_status').notNull(),status:text('status').notNull(),createdAt:integer('created_at').notNull(),checkedAt:integer('checked_at'),
},table=>[index('quest_submissions_created_at').on(table.createdAt)]);
export const questCampaign=sqliteTable('quest_campaign',{id:integer('id').primaryKey(),published:integer('published').notNull().default(0)});
