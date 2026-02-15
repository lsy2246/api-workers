import { type Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../env";
import { newApiAuth } from "../middleware/newApiAuth";
import {
	type ChannelRow,
	extractModelIds,
	mergeMetadata,
	modelsToJson,
	normalizeBaseUrlInput,
	normalizeChannelInput,
	normalizeModelsInput,
	toNewApiChannel,
} from "../services/newapi";
import { generateToken } from "../utils/crypto";
import { safeJsonParse } from "../utils/json";
import { nowIso } from "../utils/time";
import { normalizeBaseUrl } from "../utils/url";

const newapi = new Hono<AppEnv>({ strict: false });
newapi.use("*", newApiAuth);

function success<T>(c: Context<AppEnv>, data?: T, message = "") {
	return c.json(
		{
			success: true,
			message,
			...(data !== undefined ? { data } : {}),
		},
		200,
	);
}

function failure(
	c: Context<AppEnv>,
	status: ContentfulStatusCode,
	message: string,
) {
	return c.json(
		{
			success: false,
			message,
		},
		status,
	);
}

function normalizePage(
	value: string | undefined | null,
	fallback: number,
): number {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return fallback;
	}
	return Math.floor(parsed);
}

function normalizePageSize(
	value: string | undefined | null,
	fallback: number,
): number {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return fallback;
	}
	return Math.min(200, Math.floor(parsed));
}

function normalizeStatusFilter(
	value: string | undefined | null,
): string | null {
	if (!value) {
		return null;
	}
	const normalized = value.trim().toLowerCase();
	if (normalized === "all") {
		return null;
	}
	if (["enabled", "enable", "1", "active"].includes(normalized)) {
		return "active";
	}
	if (["disabled", "disable", "0", "2", "inactive"].includes(normalized)) {
		return "disabled";
	}
	return null;
}

function normalizeBoolean(value: string | undefined | null): boolean {
	if (!value) {
		return false;
	}
	const normalized = value.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}

function readTag(metadataJson: string | null | undefined): string | null {
	const metadata = safeJsonParse<Record<string, unknown>>(metadataJson, {});
	const tag = metadata.tag;
	if (tag === undefined || tag === null) {
		return null;
	}
	return String(tag);
}

async function fetchModels(baseUrl: string, apiKey: string) {
	const target = `${normalizeBaseUrl(baseUrl)}/v1/models`;
	const start = Date.now();
	const response = await fetch(target, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"x-api-key": apiKey,
			"Content-Type": "application/json",
		},
	});

	const elapsed = Date.now() - start;
	if (!response.ok) {
		return { ok: false, elapsed, models: [] as string[] };
	}

	const payload = (await response.json().catch(() => ({ data: [] }))) as
		| { data?: unknown[] }
		| unknown[];
	const models = normalizeModelsInput(
		Array.isArray(payload) ? payload : (payload.data ?? payload),
	);
	return { ok: true, elapsed, models };
}

async function updateChannelTestResult(
	c: Context<AppEnv>,
	id: string,
	ok: boolean,
	elapsed: number,
	models?: string[],
) {
	const now = Math.floor(Date.now() / 1000);
	const status = ok ? "active" : "error";
	const modelsJson = models ? modelsToJson(models) : undefined;
	const sql = modelsJson
		? "UPDATE channels SET status = ?, models_json = ?, test_time = ?, response_time_ms = ?, updated_at = ? WHERE id = ?"
		: "UPDATE channels SET status = ?, test_time = ?, response_time_ms = ?, updated_at = ? WHERE id = ?";

	const stmt = c.env.DB.prepare(sql);
	if (modelsJson) {
		await stmt.bind(status, modelsJson, now, elapsed, nowIso(), id).run();
	} else {
		await stmt.bind(status, now, elapsed, nowIso(), id).run();
	}
}

async function loadChannels(
	c: Context<AppEnv>,
	where: string[],
	bindings: Array<string | number>,
): Promise<ChannelRow[]> {
	const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
	const rows = await c.env.DB.prepare(
		`SELECT * FROM channels ${whereSql} ORDER BY priority DESC, created_at DESC`,
	)
		.bind(...bindings)
		.all<ChannelRow>();
	return rows.results ?? [];
}

newapi.get("/", async (c) => {
	const page = normalizePage(c.req.query("p") ?? c.req.query("page"), 1);
	const pageSize = normalizePageSize(
		c.req.query("page_size") ?? c.req.query("limit"),
		20,
	);
	const idSort = normalizeBoolean(c.req.query("id_sort"));
	const statusFilter = normalizeStatusFilter(c.req.query("status"));
	const typeFilter = c.req.query("type");

	const where: string[] = [];
	const bindings: Array<string | number> = [];

	if (statusFilter) {
		where.push("status = ?");
		bindings.push(statusFilter);
	}
	if (typeFilter) {
		where.push("type = ?");
		bindings.push(Number(typeFilter));
	}

	const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
	const orderSql = idSort
		? "ORDER BY id ASC"
		: "ORDER BY priority DESC, created_at DESC";
	const offset = (page - 1) * pageSize;

	const totalRow = await c.env.DB.prepare(
		`SELECT COUNT(*) as count FROM channels ${whereSql}`,
	)
		.bind(...bindings)
		.first<{ count: number }>();

	const rows = await c.env.DB.prepare(
		`SELECT * FROM channels ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
	)
		.bind(...bindings, pageSize, offset)
		.all<ChannelRow>();

	const counts = await c.env.DB.prepare(
		`SELECT type, COUNT(*) as count FROM channels ${whereSql} GROUP BY type`,
	)
		.bind(...bindings)
		.all();

	const typeCounts: Record<string, number> = {
		all: Number(totalRow?.count ?? 0),
	};
	for (const entry of counts.results ?? []) {
		typeCounts[String(entry.type)] = Number(entry.count ?? 0);
	}

	const items = (rows.results ?? []).map((row) => {
		const { key: _key, ...rest } = toNewApiChannel(row);
		return rest;
	});

	return success(c, {
		items,
		total: Number(totalRow?.count ?? 0),
		page,
		page_size: pageSize,
		type_counts: typeCounts,
	});
});

newapi.get("/search", async (c) => {
	const page = normalizePage(c.req.query("p") ?? c.req.query("page"), 1);
	const pageSize = normalizePageSize(
		c.req.query("page_size") ?? c.req.query("limit"),
		20,
	);
	const statusFilter = normalizeStatusFilter(c.req.query("status"));
	const typeFilter = c.req.query("type");
	const keyword = c.req.query("keyword") ?? "";
	const group = c.req.query("group") ?? "";
	const model = c.req.query("model") ?? "";

	const where: string[] = [];
	const bindings: Array<string | number> = [];

	if (statusFilter) {
		where.push("status = ?");
		bindings.push(statusFilter);
	}
	if (typeFilter) {
		where.push("type = ?");
		bindings.push(Number(typeFilter));
	}

	const rows = await loadChannels(c, where, bindings);
	const filtered = rows.filter((row) => {
		const channel = row;
		const models = extractModelIds(channel);
		if (
			keyword &&
			!String(channel.name).includes(keyword) &&
			!String(channel.id).includes(keyword)
		) {
			return false;
		}
		if (group && !String(channel.group_name ?? "").includes(group)) {
			return false;
		}
		if (model && !models.includes(model)) {
			return false;
		}
		return true;
	});

	const total = filtered.length;
	const offset = (page - 1) * pageSize;
	const items = filtered.slice(offset, offset + pageSize).map((row) => {
		const { key: _key, ...rest } = toNewApiChannel(row);
		return rest;
	});

	return success(c, {
		items,
		total,
		page,
		page_size: pageSize,
	});
});

newapi.put("/tag", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.tag) {
		return failure(c, 400, "tag不能为空");
	}

	const tag = String(body.tag).trim();
	const nextTag =
		body.new_tag !== undefined && body.new_tag !== null
			? String(body.new_tag).trim()
			: null;
	const nextWeight =
		body.weight !== undefined && body.weight !== null
			? Number(body.weight)
			: null;
	const nextPriority =
		body.priority !== undefined && body.priority !== null
			? Number(body.priority)
			: null;

	const rows = await c.env.DB.prepare(
		"SELECT * FROM channels",
	).all<ChannelRow>();
	const targets = (rows.results ?? []).filter(
		(row) => readTag(row.metadata_json) === tag,
	);

	for (const row of targets) {
		const metadata = safeJsonParse<Record<string, unknown>>(
			row.metadata_json,
			{},
		);
		if (nextTag && nextTag.length > 0) {
			metadata.tag = nextTag;
		} else if (metadata.tag === undefined || metadata.tag === null) {
			metadata.tag = tag;
		}
		const mergedMetadata =
			Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null;
		const weight =
			nextWeight !== null && !Number.isNaN(nextWeight)
				? nextWeight
				: (row.weight ?? 1);
		const priority =
			nextPriority !== null && !Number.isNaN(nextPriority)
				? nextPriority
				: (row.priority ?? 0);

		await c.env.DB.prepare(
			"UPDATE channels SET weight = ?, priority = ?, metadata_json = ?, updated_at = ? WHERE id = ?",
		)
			.bind(weight, priority, mergedMetadata, nowIso(), row.id)
			.run();
	}

	return success(c);
});

newapi.post("/tag/enabled", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.tag) {
		return failure(c, 400, "参数错误");
	}
	const tag = String(body.tag).trim();
	const rows = await c.env.DB.prepare(
		"SELECT * FROM channels",
	).all<ChannelRow>();
	const targets = (rows.results ?? []).filter(
		(row) => readTag(row.metadata_json) === tag,
	);

	for (const row of targets) {
		await c.env.DB.prepare(
			"UPDATE channels SET status = ?, updated_at = ? WHERE id = ?",
		)
			.bind("active", nowIso(), row.id)
			.run();
	}

	return success(c);
});

newapi.post("/tag/disabled", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.tag) {
		return failure(c, 400, "参数错误");
	}
	const tag = String(body.tag).trim();
	const rows = await c.env.DB.prepare(
		"SELECT * FROM channels",
	).all<ChannelRow>();
	const targets = (rows.results ?? []).filter(
		(row) => readTag(row.metadata_json) === tag,
	);

	for (const row of targets) {
		await c.env.DB.prepare(
			"UPDATE channels SET status = ?, updated_at = ? WHERE id = ?",
		)
			.bind("disabled", nowIso(), row.id)
			.run();
	}

	return success(c);
});

newapi.get("/models", async (c) => {
	const result = await c.env.DB.prepare(
		"SELECT * FROM channels WHERE status = ?",
	)
		.bind("active")
		.all<ChannelRow>();
	const models = new Set<string>();
	for (const row of result.results ?? []) {
		for (const id of extractModelIds(row)) {
			models.add(id);
		}
	}
	const data = Array.from(models).map((id) => ({ id, name: id }));
	return success(c, data);
});

newapi.get("/models_enabled", async (c) => {
	const result = await c.env.DB.prepare(
		"SELECT * FROM channels WHERE status = ?",
	)
		.bind("active")
		.all<ChannelRow>();
	const models = new Set<string>();
	for (const row of result.results ?? []) {
		for (const id of extractModelIds(row)) {
			models.add(id);
		}
	}
	const data = Array.from(models).map((id) => ({ id, name: id }));
	return success(c, data);
});

newapi.post("/", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body) {
		return failure(c, 400, "请求体为空");
	}

	const mode = body.mode ?? "single";
	if (mode !== "single") {
		return failure(c, 400, "仅支持单渠道添加");
	}

	const payload = body.channel ?? body;
	const parsed = normalizeChannelInput(payload);
	if (!parsed.name || !parsed.base_url || !parsed.api_key) {
		return failure(c, 400, "缺少必要参数");
	}

	const existingId = parsed.id ?? generateToken("ch_");
	const exists = await c.env.DB.prepare("SELECT id FROM channels WHERE id = ?")
		.bind(existingId)
		.first();
	if (exists) {
		return failure(c, 409, "渠道已存在");
	}

	const now = nowIso();
	const baseUrl = normalizeBaseUrlInput(parsed.base_url);
	await c.env.DB.prepare(
		"INSERT INTO channels (id, name, base_url, api_key, weight, status, rate_limit, models_json, type, group_name, priority, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
	)
		.bind(
			existingId,
			parsed.name,
			baseUrl ?? normalizeBaseUrl(String(parsed.base_url)),
			parsed.api_key,
			parsed.weight ?? 1,
			parsed.status ?? "active",
			parsed.rate_limit ?? 0,
			parsed.models_json,
			parsed.type ?? 1,
			parsed.group_name,
			parsed.priority ?? 0,
			parsed.metadata_json,
			now,
			now,
		)
		.run();

	return success(c);
});

newapi.put("/", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body) {
		return failure(c, 400, "请求体为空");
	}
	const payload = body.channel ?? body;
	const id = payload?.id ?? body?.id;
	if (!id) {
		return failure(c, 400, "缺少渠道ID");
	}

	const current = await c.env.DB.prepare("SELECT * FROM channels WHERE id = ?")
		.bind(String(id))
		.first<ChannelRow>();
	if (!current) {
		return failure(c, 404, "渠道不存在");
	}

	const parsed = normalizeChannelInput(payload);
	const models =
		parsed.models.length > 0 ? parsed.models : extractModelIds(current);
	const mergedMetadata = mergeMetadata(
		current.metadata_json,
		parsed.metadata_json,
	);
	const nextBaseUrl =
		normalizeBaseUrlInput(parsed.base_url ?? current.base_url) ??
		String(current.base_url);

	await c.env.DB.prepare(
		"UPDATE channels SET name = ?, base_url = ?, api_key = ?, weight = ?, status = ?, rate_limit = ?, models_json = ?, type = ?, group_name = ?, priority = ?, metadata_json = ?, updated_at = ? WHERE id = ?",
	)
		.bind(
			parsed.name ?? current.name,
			nextBaseUrl,
			parsed.api_key ?? current.api_key,
			parsed.weight ?? current.weight ?? 1,
			parsed.status ?? current.status,
			parsed.rate_limit ?? current.rate_limit ?? 0,
			modelsToJson(models),
			parsed.type ?? current.type ?? 1,
			parsed.group_name ?? current.group_name,
			parsed.priority ?? current.priority ?? 0,
			mergedMetadata,
			nowIso(),
			String(id),
		)
		.run();

	return success(c);
});

newapi.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const existing = await c.env.DB.prepare(
		"SELECT id FROM channels WHERE id = ?",
	)
		.bind(id)
		.first();
	if (!existing) {
		return failure(c, 404, "渠道不存在");
	}
	await c.env.DB.prepare("DELETE FROM channels WHERE id = ?").bind(id).run();
	return success(c);
});

newapi.get("/test/:id", async (c) => {
	const id = c.req.param("id");
	const channel = await c.env.DB.prepare("SELECT * FROM channels WHERE id = ?")
		.bind(id)
		.first<ChannelRow>();
	if (!channel) {
		return failure(c, 404, "渠道不存在");
	}

	const result = await fetchModels(
		String(channel.base_url),
		String(channel.api_key),
	);
	if (!result.ok) {
		await updateChannelTestResult(c, id, false, result.elapsed);
		return failure(c, 502, "渠道测试失败");
	}

	await updateChannelTestResult(c, id, true, result.elapsed);

	return success(c, undefined, "测试成功");
});

newapi.post("/test", async (c) => {
	const body = await c.req.json().catch(() => null);
	const id = body?.id;
	if (!id) {
		return failure(c, 400, "缺少渠道ID");
	}
	const channel = await c.env.DB.prepare("SELECT * FROM channels WHERE id = ?")
		.bind(String(id))
		.first();
	if (!channel) {
		return failure(c, 404, "渠道不存在");
	}
	const result = await fetchModels(
		String(channel.base_url),
		String(channel.api_key),
	);
	if (!result.ok) {
		await updateChannelTestResult(c, String(id), false, result.elapsed);
		return failure(c, 502, "渠道测试失败");
	}
	await updateChannelTestResult(c, String(id), true, result.elapsed);
	return success(c, undefined, "测试成功");
});

newapi.get("/fetch_models/:id", async (c) => {
	const id = c.req.param("id");
	const channel = await c.env.DB.prepare("SELECT * FROM channels WHERE id = ?")
		.bind(id)
		.first();
	if (!channel) {
		return failure(c, 404, "渠道不存在");
	}

	const result = await fetchModels(
		String(channel.base_url),
		String(channel.api_key),
	);
	if (!result.ok) {
		await updateChannelTestResult(c, id, false, result.elapsed);
		return failure(c, 502, "获取模型失败");
	}

	await updateChannelTestResult(c, id, true, result.elapsed, result.models);

	return success(c, result.models);
});

newapi.post("/fetch_models", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.base_url || !body?.key) {
		return failure(c, 400, "缺少必要参数");
	}

	const result = await fetchModels(String(body.base_url), String(body.key));
	if (!result.ok) {
		return failure(c, 502, "获取模型失败");
	}

	return success(c, result.models);
});

newapi.get("/:id", async (c) => {
	const id = c.req.param("id");
	const channel = await c.env.DB.prepare("SELECT * FROM channels WHERE id = ?")
		.bind(id)
		.first<ChannelRow>();
	if (!channel) {
		return failure(c, 404, "渠道不存在");
	}
	const metadata = safeJsonParse<Record<string, unknown>>(
		channel.metadata_json,
		{},
	);
	const modelMapping =
		metadata.model_mapping === undefined || metadata.model_mapping === null
			? "{}"
			: String(metadata.model_mapping);
	const channelInfo =
		metadata.channel_info &&
		typeof metadata.channel_info === "object" &&
		!Array.isArray(metadata.channel_info)
			? (metadata.channel_info as {
					is_multi_key?: boolean;
					multi_key_mode?: string;
				})
			: {
					is_multi_key: false,
					multi_key_mode: "random",
				};
	const output = toNewApiChannel(channel);
	return success(c, {
		...output,
		model_mapping: modelMapping,
		channel_info: channelInfo,
	});
});

export default newapi;
