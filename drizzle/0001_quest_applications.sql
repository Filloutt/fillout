CREATE TABLE quest_sessions (id TEXT PRIMARY KEY NOT NULL, expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE quest_submissions (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL, address TEXT NOT NULL UNIQUE, post_id TEXT NOT NULL UNIQUE, post_url TEXT NOT NULL, x_username TEXT NOT NULL, api_status TEXT NOT NULL, manual_status TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL, checked_at INTEGER);
--> statement-breakpoint
CREATE INDEX quest_submissions_created_at ON quest_submissions(created_at);
--> statement-breakpoint
CREATE TABLE quest_campaign (id INTEGER PRIMARY KEY NOT NULL, published INTEGER NOT NULL DEFAULT 0);
