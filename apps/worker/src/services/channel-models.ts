import { safeJsonParse } from "../utils/json";
import type { ChannelRow } from "./channel-types";

export type ModelEntry = {
	id: string;
	label: string;
	channelId: string;
	channelName: string;
};

type ModelLike = { id?: unknown };

function toModelId(item: unknown): string {
	if (item && typeof item === "object" && "id" in item) {
		const value = (item as ModelLike).id;
		return value === undefined || value === null ? "" : String(value);
	}
	if (item === undefined || item === null) {
		return "";
	}
	return String(item);
}

export function normalizeModelsInput(input: unknown): string[] {
	if (!input) {
		return [];
	}
	if (Array.isArray(input)) {
		return input.map((item) => String(item)).filter((item) => item.length > 0);
	}
	if (typeof input === "string") {
		return input
			.split(",")
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
	}
	if (typeof input === "object") {
		const raw = input as { data?: unknown[] };
		if (Array.isArray(raw.data)) {
			return raw.data
				.map((item) => toModelId(item))
				.filter((item) => item.length > 0);
		}
	}
	return [];
}

export function modelsToJson(models: string[]): string {
	const normalized = models
		.map((model) => String(model).trim())
		.filter((model) => model.length > 0);
	return JSON.stringify(normalized.map((id) => ({ id })));
}

export function extractModelIds(
	channel: Pick<ChannelRow, "models_json">,
): string[] {
	const raw = safeJsonParse<ModelLike[] | { data?: ModelLike[] } | null>(
		channel.models_json,
		null,
	);
	const models = Array.isArray(raw)
		? raw
		: Array.isArray(raw?.data)
			? raw.data
			: [];
	return models
		.map((model) => toModelId(model))
		.filter((model: string) => model.length > 0);
}

export function extractModels(
	channel: Pick<ChannelRow, "id" | "name" | "models_json">,
): ModelEntry[] {
	return extractModelIds(channel).map((id) => ({
		id,
		label: id,
		channelId: channel.id,
		channelName: channel.name,
	}));
}

export function collectUniqueModelIds(
	channels: Array<Pick<ChannelRow, "models_json">>,
): string[] {
	const models = new Set<string>();
	for (const channel of channels) {
		for (const id of extractModelIds(channel)) {
			models.add(id);
		}
	}
	return Array.from(models);
}
