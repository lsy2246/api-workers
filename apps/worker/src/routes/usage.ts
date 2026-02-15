import { Hono } from "hono";
import type { AppEnv } from "../env";
import { getRetentionDays } from "../services/settings";
import { pruneUsageLogs } from "../services/usage";

const usage = new Hono<AppEnv>();

/**
 * Lists usage logs with filters.
 */
usage.get("/", async (c) => {
	const query = c.req.query();
	const params: Array<string | number> = [];
	let sql =
		"SELECT usage_logs.*, channels.name as channel_name, tokens.name as token_name FROM usage_logs LEFT JOIN channels ON channels.id = usage_logs.channel_id LEFT JOIN tokens ON tokens.id = usage_logs.token_id WHERE 1=1";

	if (query.from) {
		sql += " AND usage_logs.created_at >= ?";
		params.push(query.from);
	}
	if (query.to) {
		sql += " AND usage_logs.created_at <= ?";
		params.push(query.to);
	}
	if (query.model) {
		sql += " AND usage_logs.model = ?";
		params.push(query.model);
	}
	if (query.channel_id) {
		sql += " AND usage_logs.channel_id = ?";
		params.push(query.channel_id);
	}
	if (query.token_id) {
		sql += " AND usage_logs.token_id = ?";
		params.push(query.token_id);
	}

	const limit = Math.min(Number(query.limit ?? 50), 200);
	sql += " ORDER BY usage_logs.created_at DESC LIMIT ?";
	params.push(Number.isNaN(limit) ? 50 : limit);

	const retention = await getRetentionDays(c.env.DB);
	await pruneUsageLogs(c.env.DB, retention);

	const result = await c.env.DB.prepare(sql)
		.bind(...params)
		.all();
	return c.json({ logs: result.results ?? [] });
});

export default usage;
