CREATE TABLE IF NOT EXISTS agent_challenges (
 id TEXT PRIMARY KEY NOT NULL,
 wallet TEXT NOT NULL,
 agent_name TEXT NOT NULL,
 intent_json TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0,1))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_challenges_wallet_created ON agent_challenges(wallet,created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_challenges_expires ON agent_challenges(expires_at);
