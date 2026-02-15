import { Hono } from "hono";
import type { AppEnv } from "../env";

const dashboard = new Hono<AppEnv>();

function buildDateFilters(query: Record<string, string>) {
	let sql = " WHERE 1=1";
	const params: Array<string> = [];
	if (query.from) {
		sql += " AND created_at >= ?";
		params.push(query.from);
	}
	if (query.to) {
		sql += " AND created_at <= ?";
		params.push(query.to);
	}
	return { sql, params };
}

/**
 * Returns aggregated usage metrics.
 */
dashboard.get("/", async (c) => {
	const query = c.req.query();
	const { sql, params } = buildDateFilters(query);

	const summary = await c.env.DB.prepare(
		`SELECT COUNT(*) as total_requests, COALESCE(SUM(total_tokens), 0) as total_tokens, COALESCE(AVG(latency_ms), 0) as avg_latency, COALESCE(SUM(CASE WHEN status != 'ok' THEN 1 ELSE 0 END), 0) as total_errors FROM usage_logs${sql}`,
	)
		.bind(...params)
		.first();

	const byDay = await c.env.DB.prepare(
		`SELECT substr(created_at, 1, 10) as day, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as tokens FROM usage_logs${sql} GROUP BY day ORDER BY day DESC LIMIT 30`,
	)
		.bind(...params)
		.all();

	const byModel = await c.env.DB.prepare(
		`SELECT model, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as tokens FROM usage_logs${sql} GROUP BY model ORDER BY requests DESC LIMIT 20`,
	)
		.bind(...params)
		.all();

	const byChannel = await c.env.DB.prepare(
		`SELECT channels.id as channel_id, channels.name as channel_name, COUNT(usage_logs.id) as requests, COALESCE(SUM(usage_logs.total_tokens), 0) as tokens FROM usage_logs LEFT JOIN channels ON channels.id = usage_logs.channel_id${sql} GROUP BY channels.id, channels.name ORDER BY requests DESC LIMIT 20`,
	)
		.bind(...params)
		.all();

	const byToken = await c.env.DB.prepare(
		`SELECT tokens.id as token_id, tokens.name as token_name, COUNT(usage_logs.id) as requests, COALESCE(SUM(usage_logs.total_tokens), 0) as tokens FROM usage_logs LEFT JOIN tokens ON tokens.id = usage_logs.token_id${sql} GROUP BY tokens.id, tokens.name ORDER BY requests DESC LIMIT 20`,
	)
		.bind(...params)
		.all();

	return c.json({
		summary: summary ?? {
			total_requests: 0,
			total_tokens: 0,
			avg_latency: 0,
			total_errors: 0,
		},
		byDay: byDay.results ?? [],
		byModel: byModel.results ?? [],
		byChannel: byChannel.results ?? [],
		byToken: byToken.results ?? [],
	});
});

export default dashboard;
