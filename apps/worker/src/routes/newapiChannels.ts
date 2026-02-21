import { type Context, Hono } from "hono";
import type { AppEnv } from "../env";
import { newApiAuth } from "../middleware/newApiAuth";
import {
	mergeMetadata,
	modelsToJson,
	normalizeBaseUrlInput,
	normalizeChannelInput,
	toNewApiChannel,
	withNewApiDefaults,
} from "../services/newapi";
import {
	collectUniqueModelIds,
	extractModelIds,
} from "../services/channel-models";
import {
	channelExists,
	countChannels,
	countChannelsByType,
	deleteChannel,
	getChannelById,
	insertChannel,
	listActiveChannels,
	listChannels,
	updateChannel,
} from "../services/channel-repo";
import {
	fetchChannelModels,
	updateChannelTestResult,
} from "../services/channel-testing";
import { generateToken } from "../utils/crypto";
import { safeJsonParse } from "../utils/json";
import { newApiFailure, newApiSuccess } from "../utils/newapi-response";
import {
	normalizeBoolean,
	normalizePage,
	normalizePageSize,
	normalizeStatusFilter,
} from "../utils/paging";
import { nowIso } from "../utils/time";
import { normalizeBaseUrl } from "../utils/url";

const newapi = new Hono<AppEnv>({ strict: false });
newapi.use("*", newApiAuth);

function readTag(metadataJson: string | null | undefined): string | null {
	const metadata = safeJsonParse<Record<string, unknown>>(metadataJson, {});
	const tag = metadata.tag;
	if (tag === undefined || tag === null) {
		return null;
	}
	return String(tag);
}

async function handleModelsList(c: Context<AppEnv>) {
	const channels = await listActiveChannels(c.env.DB);
	const data = collectUniqueModelIds(channels).map((id) => ({ id, name: id }));
	return newApiSuccess(c, data);
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

	const filters = {
		status: statusFilter ?? undefined,
		type: typeFilter ? Number(typeFilter) : undefined,
	};
	const offset = (page - 1) * pageSize;
	const orderBy = idSort ? "id" : "priority";
	const order = idSort ? "ASC" : "DESC";

	const total = await countChannels(c.env.DB, filters);
	const typeCounts = await countChannelsByType(c.env.DB, filters);
	typeCounts.all = total;

	const rows = await listChannels(c.env.DB, {
		filters,
		orderBy,
		order,
		limit: pageSize,
		offset,
	});

	const items = rows.map((row) => {
		const { key: _key, ...rest } = toNewApiChannel(row);
		return withNewApiDefaults(rest);
	});

	return newApiSuccess(c, {
		items,
		total,
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
	const filters = {
		status: statusFilter ?? undefined,
		type: typeFilter ? Number(typeFilter) : undefined,
	};
	const rows = await listChannels(c.env.DB, {
		filters,
		orderBy: "priority",
		order: "DESC",
	});
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
		return withNewApiDefaults(rest);
	});

	return newApiSuccess(c, {
		items,
		total,
		page,
		page_size: pageSize,
	});
});

newapi.put("/tag", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.tag) {
		return newApiFailure(c, 400, "tag不能为空");
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

	const rows = await listChannels(c.env.DB);
	const targets = rows.filter((row) => readTag(row.metadata_json) === tag);

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

	return newApiSuccess(c);
});

newapi.post("/tag/enabled", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.tag) {
		return newApiFailure(c, 400, "参数错误");
	}
	const tag = String(body.tag).trim();
	const rows = await listChannels(c.env.DB);
	const targets = rows.filter((row) => readTag(row.metadata_json) === tag);

	for (const row of targets) {
		await c.env.DB.prepare(
			"UPDATE channels SET status = ?, updated_at = ? WHERE id = ?",
		)
			.bind("active", nowIso(), row.id)
			.run();
	}

	return newApiSuccess(c);
});

newapi.post("/tag/disabled", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.tag) {
		return newApiFailure(c, 400, "参数错误");
	}
	const tag = String(body.tag).trim();
	const rows = await listChannels(c.env.DB);
	const targets = rows.filter((row) => readTag(row.metadata_json) === tag);

	for (const row of targets) {
		await c.env.DB.prepare(
			"UPDATE channels SET status = ?, updated_at = ? WHERE id = ?",
		)
			.bind("disabled", nowIso(), row.id)
			.run();
	}

	return newApiSuccess(c);
});

newapi.get("/models", handleModelsList);
newapi.get("/models_enabled", handleModelsList);

newapi.post("/", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body) {
		return newApiFailure(c, 400, "请求体为空");
	}

	const mode = body.mode ?? "single";
	if (mode !== "single") {
		return newApiFailure(c, 400, "仅支持单渠道添加");
	}

	const payload = body.channel ?? body;
	const parsed = normalizeChannelInput(payload);
	if (!parsed.name || !parsed.base_url || !parsed.api_key) {
		return newApiFailure(c, 400, "缺少必要参数");
	}

	const existingId = parsed.id ?? generateToken("ch_");
	const exists = await channelExists(c.env.DB, existingId);
	if (exists) {
		return newApiFailure(c, 409, "渠道已存在");
	}

	const now = nowIso();
	const baseUrl = normalizeBaseUrlInput(parsed.base_url);
	await insertChannel(c.env.DB, {
		id: existingId,
		name: parsed.name,
		base_url: baseUrl ?? normalizeBaseUrl(String(parsed.base_url)),
		api_key: parsed.api_key,
		weight: parsed.weight ?? 1,
		status: parsed.status ?? "active",
		rate_limit: parsed.rate_limit ?? 0,
		models_json: parsed.models_json,
		type: parsed.type ?? 1,
		group_name: parsed.group_name ?? null,
		priority: parsed.priority ?? 0,
		metadata_json: parsed.metadata_json,
		created_at: now,
		updated_at: now,
	});

	return newApiSuccess(c);
});

newapi.put("/", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body) {
		return newApiFailure(c, 400, "请求体为空");
	}
	const payload = body.channel ?? body;
	const id = payload?.id ?? body?.id;
	if (!id) {
		return newApiFailure(c, 400, "缺少渠道ID");
	}

	const current = await getChannelById(c.env.DB, String(id));
	if (!current) {
		return newApiFailure(c, 404, "渠道不存在");
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

	await updateChannel(c.env.DB, String(id), {
		name: parsed.name ?? current.name,
		base_url: nextBaseUrl,
		api_key: parsed.api_key ?? current.api_key,
		weight: parsed.weight ?? current.weight ?? 1,
		status: parsed.status ?? current.status,
		rate_limit: parsed.rate_limit ?? current.rate_limit ?? 0,
		models_json: modelsToJson(models),
		type: parsed.type ?? current.type ?? 1,
		group_name: parsed.group_name ?? current.group_name ?? null,
		priority: parsed.priority ?? current.priority ?? 0,
		metadata_json: mergedMetadata,
		updated_at: nowIso(),
	});

	return newApiSuccess(c);
});

newapi.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const existing = await getChannelById(c.env.DB, id);
	if (!existing) {
		return newApiFailure(c, 404, "渠道不存在");
	}
	await deleteChannel(c.env.DB, id);
	return newApiSuccess(c);
});

newapi.get("/test/:id", async (c) => {
	const id = c.req.param("id");
	const channel = await getChannelById(c.env.DB, id);
	if (!channel) {
		return newApiFailure(c, 404, "渠道不存在");
	}

	const result = await fetchChannelModels(
		String(channel.base_url),
		String(channel.api_key),
	);
	if (!result.ok) {
		await updateChannelTestResult(c.env.DB, id, {
			ok: false,
			elapsed: result.elapsed,
		});
		return newApiFailure(c, 502, "渠道测试失败");
	}

	await updateChannelTestResult(c.env.DB, id, {
		ok: true,
		elapsed: result.elapsed,
	});

	return newApiSuccess(c, undefined, "测试成功");
});

newapi.post("/test", async (c) => {
	const body = await c.req.json().catch(() => null);
	const id = body?.id;
	if (!id) {
		return newApiFailure(c, 400, "缺少渠道ID");
	}
	const channel = await getChannelById(c.env.DB, String(id));
	if (!channel) {
		return newApiFailure(c, 404, "渠道不存在");
	}
	const result = await fetchChannelModels(
		String(channel.base_url),
		String(channel.api_key),
	);
	if (!result.ok) {
		await updateChannelTestResult(c.env.DB, String(id), {
			ok: false,
			elapsed: result.elapsed,
		});
		return newApiFailure(c, 502, "渠道测试失败");
	}
	await updateChannelTestResult(c.env.DB, String(id), {
		ok: true,
		elapsed: result.elapsed,
	});
	return newApiSuccess(c, undefined, "测试成功");
});

newapi.get("/fetch_models/:id", async (c) => {
	const id = c.req.param("id");
	const channel = await getChannelById(c.env.DB, id);
	if (!channel) {
		return newApiFailure(c, 404, "渠道不存在");
	}

	const result = await fetchChannelModels(
		String(channel.base_url),
		String(channel.api_key),
	);
	if (!result.ok) {
		await updateChannelTestResult(c.env.DB, id, {
			ok: false,
			elapsed: result.elapsed,
		});
		return newApiFailure(c, 502, "获取模型失败");
	}

	await updateChannelTestResult(c.env.DB, id, {
		ok: true,
		elapsed: result.elapsed,
		models: result.models,
	});

	return newApiSuccess(c, result.models);
});

newapi.post("/fetch_models", async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body?.base_url || !body?.key) {
		return newApiFailure(c, 400, "缺少必要参数");
	}

	const result = await fetchChannelModels(
		String(body.base_url),
		String(body.key),
	);
	if (!result.ok) {
		return newApiFailure(c, 502, "获取模型失败");
	}

	return newApiSuccess(c, result.models);
});

newapi.get("/:id", async (c) => {
	const id = c.req.param("id");
	const channel = await getChannelById(c.env.DB, id);
	if (!channel) {
		return newApiFailure(c, 404, "渠道不存在");
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
	const output = withNewApiDefaults(toNewApiChannel(channel));
	return newApiSuccess(c, {
		...output,
		model_mapping: modelMapping,
		channel_info: channelInfo,
	});
});

export default newapi;

