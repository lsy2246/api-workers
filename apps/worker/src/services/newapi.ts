import { safeJsonParse } from "../utils/json";
import { normalizeBaseUrl } from "../utils/url";
import type { ChannelRow } from "./channel-types";
import {
	extractModelIds,
	modelsToJson,
	normalizeModelsInput,
} from "./channel-models";
import { toInternalStatus, toNewApiStatus } from "./channel-status";

export { extractModelIds, modelsToJson, normalizeModelsInput };
export { toInternalStatus, toNewApiStatus };
export type { ChannelRow };

export type NewApiChannel = {
	id: string;
	name: string;
	type: number;
	status: number;
	priority: number;
	weight: number;
	models: string;
	group: string;
	response_time: number;
	test_time: number;
	base_url?: string;
	key?: string;
	created_time?: number;
	updated_time?: number;
	openai_organization?: string;
	test_model?: string;
	other?: string;
	balance?: number;
	balance_updated_time?: number;
	used_quota?: number;
	model_mapping?: string;
	status_code_mapping?: string;
	auto_ban?: number;
	other_info?: string;
	tag?: string;
	setting?: string;
	param_override?: string;
	header_override?: string;
	remark?: string;
	channel_info?: ChannelInfo;
	settings?: string;
};

export type ChannelInfo = {
	is_multi_key: boolean;
	multi_key_size: number;
	multi_key_status_list: unknown[] | null;
	multi_key_polling_index: number;
	multi_key_mode: string;
};

export type ParsedChannelInput = {
	id?: string;
	name?: string;
	type?: number;
	base_url?: string;
	api_key?: string;
	weight?: number;
	status?: string;
	rate_limit?: number;
	models: string[];
	models_json: string;
	group_name?: string | null;
	priority?: number;
	metadata_json?: string | null;
};

const DEFAULT_CHANNEL_INFO: ChannelInfo = {
	is_multi_key: false,
	multi_key_size: 0,
	multi_key_status_list: null,
	multi_key_polling_index: 0,
	multi_key_mode: "",
};

const DEFAULT_NEWAPI_FIELDS = {
	key: "",
	openai_organization: "",
	test_model: "",
	other: "",
	balance: 0,
	balance_updated_time: 0,
	used_quota: 0,
	model_mapping: "",
	status_code_mapping: "",
	auto_ban: 1,
	other_info: "",
	tag: "",
	setting: "",
	param_override: "",
	header_override: "",
	remark: "",
	channel_info: DEFAULT_CHANNEL_INFO,
	settings: "",
} as const;

const KNOWN_KEYS = new Set([
	"id",
	"name",
	"type",
	"key",
	"api_key",
	"base_url",
	"baseUrl",
	"weight",
	"status",
	"rate_limit",
	"rateLimit",
	"models",
	"model",
	"model_list",
	"models_list",
	"group",
	"group_name",
	"groups",
	"priority",
]);

export function withNewApiDefaults<T extends Record<string, unknown>>(
	channel: T,
): T & typeof DEFAULT_NEWAPI_FIELDS {
	const merged: Record<string, unknown> = { ...channel };
	for (const [key, fallback] of Object.entries(DEFAULT_NEWAPI_FIELDS)) {
		if (merged[key] === undefined || merged[key] === null) {
			merged[key] = fallback;
		}
	}

	const channelInfo = merged.channel_info;
	if (
		channelInfo &&
		typeof channelInfo === "object" &&
		!Array.isArray(channelInfo)
	) {
		merged.channel_info = { ...DEFAULT_CHANNEL_INFO, ...channelInfo };
	} else {
		merged.channel_info = { ...DEFAULT_CHANNEL_INFO };
	}

	return merged as T & typeof DEFAULT_NEWAPI_FIELDS;
}

function toNumber(
	value: unknown,
	fallback: number | null = null,
): number | null {
	if (value === null || value === undefined) {
		return fallback;
	}
	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
}

export function normalizeChannelInput(
	body: Record<string, unknown> | null,
): ParsedChannelInput {
	const hasModels =
		body &&
		(Object.hasOwn(body, "models") ||
			Object.hasOwn(body, "model") ||
			Object.hasOwn(body, "model_list") ||
			Object.hasOwn(body, "models_list"));
	const models = hasModels
		? normalizeModelsInput(
				body?.models ?? body?.model ?? body?.model_list ?? body?.models_list,
			)
		: [];
	const hasGroup =
		body &&
		(Object.hasOwn(body, "group") ||
			Object.hasOwn(body, "group_name") ||
			Object.hasOwn(body, "groups"));
	const groupInput = body?.group ?? body?.group_name ?? null;
	const groupsInput = Array.isArray(body?.groups)
		? (body.groups as unknown[]).map((item) => String(item))
		: null;
	const groupName = !hasGroup
		? undefined
		: groupInput
			? String(groupInput)
			: groupsInput && groupsInput.length > 0
				? groupsInput.join(",")
				: null;

	const metadata: Record<string, unknown> = {};
	if (body && typeof body === "object") {
		for (const [key, value] of Object.entries(body)) {
			if (KNOWN_KEYS.has(key)) {
				continue;
			}
			metadata[key] = value;
		}
	}

	const hasType = body && Object.hasOwn(body, "type");
	const hasWeight = body && Object.hasOwn(body, "weight");
	const hasStatus = body && Object.hasOwn(body, "status");
	const hasRateLimit =
		body &&
		(Object.hasOwn(body, "rate_limit") || Object.hasOwn(body, "rateLimit"));
	const hasPriority = body && Object.hasOwn(body, "priority");

	return {
		id:
			body?.id !== undefined && body?.id !== null ? String(body.id) : undefined,
		name: body?.name ? String(body.name) : undefined,
		type: hasType ? (toNumber(body?.type, 1) ?? 1) : undefined,
		base_url:
			body?.base_url !== undefined && body?.base_url !== null
				? String(body.base_url)
				: body?.baseUrl !== undefined && body?.baseUrl !== null
					? String(body.baseUrl)
					: undefined,
		api_key:
			body?.key !== undefined && body?.key !== null
				? String(body.key)
				: body?.api_key !== undefined && body?.api_key !== null
					? String(body.api_key)
					: undefined,
		weight: hasWeight ? (toNumber(body?.weight, 1) ?? 1) : undefined,
		status: hasStatus ? toInternalStatus(body?.status) : undefined,
		rate_limit: hasRateLimit
			? (toNumber(body?.rate_limit ?? body?.rateLimit, 0) ?? 0)
			: undefined,
		models,
		models_json: modelsToJson(models),
		group_name: groupName,
		priority: hasPriority ? (toNumber(body?.priority, 0) ?? 0) : undefined,
		metadata_json:
			Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
	};
}

export function mergeMetadata(
	existing: string | null | undefined,
	incoming: string | null | undefined,
): string | null {
	const base = safeJsonParse<Record<string, unknown>>(existing, {});
	const updates = safeJsonParse<Record<string, unknown>>(incoming, {});
	const merged = { ...base, ...updates };
	return Object.keys(merged).length > 0 ? JSON.stringify(merged) : null;
}

export function toNewApiChannel(channel: ChannelRow): NewApiChannel {
	const models = extractModelIds(channel);
	const metadata = safeJsonParse<Record<string, unknown>>(
		channel.metadata_json,
		{},
	);
	const createdTime = channel.created_at ? Date.parse(channel.created_at) : NaN;
	const updatedTime = channel.updated_at ? Date.parse(channel.updated_at) : NaN;

	return {
		id: channel.id,
		name: channel.name,
		type: Number(channel.type ?? 1),
		status: toNewApiStatus(channel.status),
		priority: Number(channel.priority ?? 0),
		weight: Number(channel.weight ?? 1),
		models: models.join(","),
		group: channel.group_name ?? "",
		response_time: Number(channel.response_time_ms ?? 0),
		test_time: toNumber(channel.test_time, 0) ?? 0,
		base_url: channel.base_url,
		key: channel.api_key,
		created_time: Number.isNaN(createdTime)
			? undefined
			: Math.floor(createdTime / 1000),
		updated_time: Number.isNaN(updatedTime)
			? undefined
			: Math.floor(updatedTime / 1000),
		...metadata,
	};
}

export function normalizeBaseUrlInput(
	value: string | undefined | null,
): string | null {
	if (!value) {
		return null;
	}
	return normalizeBaseUrl(String(value));
}
