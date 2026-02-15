import { Hono } from "hono";
import type { AppEnv } from "../env";
import type { ChannelRecord } from "../services/channels";
import { generateToken } from "../utils/crypto";
import { jsonError } from "../utils/http";
import { safeJsonParse } from "../utils/json";
import { nowIso } from "../utils/time";
import { normalizeBaseUrl } from "../utils/url";

const channels = new Hono<AppEnv>();

type ChannelPayload = {
	id?: string | number;
	channel_id?: string | number;
	channelId?: string | number;
	name?: string;
	base_url?: string;
	api_key?: string;
	weight?: number;
	status?: string;
	rate_limit?: number;
	models?: unknown[];
};

/**
 * Resolves a channel id from request payload.
 *
 * Args:
 *   body: Request payload.
 *
 * Returns:
 *   Channel id if provided.
 */
function resolveChannelId(body: ChannelPayload | null): string | null {
	const candidate = body?.id ?? body?.channel_id ?? body?.channelId;
	if (!candidate) {
		return null;
	}
	const normalized = String(candidate).trim();
	return normalized.length > 0 ? normalized : null;
}

/**
 * Lists all channels.
 */
channels.get("/", async (c) => {
	const result = await c.env.DB.prepare(
		"SELECT * FROM channels ORDER BY created_at DESC",
	).all();
	return c.json({ channels: result.results ?? [] });
});

/**
 * Creates a new channel.
 */
channels.post("/", async (c) => {
	const body = (await c.req.json().catch(() => null)) as ChannelPayload | null;
	if (!body?.name || !body?.base_url || !body?.api_key) {
		return jsonError(c, 400, "missing_fields", "missing_fields");
	}

	const requestedId = resolveChannelId(body);
	if (requestedId) {
		const exists = await c.env.DB.prepare(
			"SELECT id FROM channels WHERE id = ?",
		)
			.bind(requestedId)
			.first();
		if (exists) {
			return jsonError(c, 409, "channel_id_exists", "channel_id_exists");
		}
	}

	const id = requestedId ?? generateToken("ch_");
	const now = nowIso();

	await c.env.DB.prepare(
		"INSERT INTO channels (id, name, base_url, api_key, weight, status, rate_limit, models_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
	)
		.bind(
			id,
			body.name,
			normalizeBaseUrl(String(body.base_url)),
			body.api_key,
			Number(body.weight ?? 1),
			body.status ?? "active",
			body.rate_limit ?? 0,
			JSON.stringify(body.models ?? []),
			now,
			now,
		)
		.run();

	return c.json({ id });
});

/**
 * Updates a channel.
 */
channels.patch("/:id", async (c) => {
	const body = (await c.req.json().catch(() => null)) as ChannelPayload | null;
	const id = c.req.param("id");
	if (!body) {
		return jsonError(c, 400, "missing_body", "missing_body");
	}

	const current = await c.env.DB.prepare("SELECT * FROM channels WHERE id = ?")
		.bind(id)
		.first<ChannelRecord>();
	if (!current) {
		return jsonError(c, 404, "channel_not_found", "channel_not_found");
	}

	const models = body.models ?? safeJsonParse(current.models_json, []);

	await c.env.DB.prepare(
		"UPDATE channels SET name = ?, base_url = ?, api_key = ?, weight = ?, status = ?, rate_limit = ?, models_json = ?, updated_at = ? WHERE id = ?",
	)
		.bind(
			body.name ?? current.name,
			normalizeBaseUrl(String(body.base_url ?? current.base_url)),
			body.api_key ?? current.api_key,
			Number(body.weight ?? current.weight ?? 1),
			body.status ?? current.status,
			body.rate_limit ?? current.rate_limit ?? 0,
			JSON.stringify(models),
			nowIso(),
			id,
		)
		.run();

	return c.json({ ok: true });
});

/**
 * Deletes a channel.
 */
channels.delete("/:id", async (c) => {
	const id = c.req.param("id");
	await c.env.DB.prepare("DELETE FROM channels WHERE id = ?").bind(id).run();
	return c.json({ ok: true });
});

/**
 * Tests channel connectivity and updates model list.
 */
channels.post("/:id/test", async (c) => {
	const id = c.req.param("id");
	const channel = await c.env.DB.prepare("SELECT * FROM channels WHERE id = ?")
		.bind(id)
		.first();
	if (!channel) {
		return jsonError(c, 404, "channel_not_found", "channel_not_found");
	}

	const target = `${normalizeBaseUrl(String(channel.base_url))}/v1/models`;
	const response = await fetch(target, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${channel.api_key}`,
			"x-api-key": String(channel.api_key),
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		await c.env.DB.prepare(
			"UPDATE channels SET status = ?, updated_at = ? WHERE id = ?",
		)
			.bind("error", nowIso(), id)
			.run();
		return jsonError(c, 502, "channel_unreachable", "channel_unreachable");
	}

	const payload = (await response.json().catch(() => ({ data: [] }))) as
		| { data?: unknown[] }
		| unknown[];
	const models = Array.isArray(payload) ? payload : (payload?.data ?? []);
	await c.env.DB.prepare(
		"UPDATE channels SET status = ?, models_json = ?, updated_at = ? WHERE id = ?",
	)
		.bind("active", JSON.stringify(payload), nowIso(), id)
		.run();

	return c.json({ ok: true, models });
});

export default channels;
