import { safeJsonParse } from "../utils/json";

export type ChannelRecord = {
	id: string;
	name: string;
	base_url: string;
	api_key: string;
	weight: number;
	status: string;
	rate_limit?: number | null;
	models_json?: string | null;
};

export type ModelEntry = {
	id: string;
	label: string;
	channelId: string;
	channelName: string;
};

type ModelPayload = {
	id?: string | number;
};

/**
 * Returns channels in a weighted random order.
 */
export function createWeightedOrder(
	channels: ChannelRecord[],
): ChannelRecord[] {
	const pool = channels.map((channel) => ({
		...channel,
		weight: Math.max(1, Number(channel.weight) || 1),
	}));
	const ordered: ChannelRecord[] = [];
	while (pool.length > 0) {
		const total = pool.reduce((sum, channel) => sum + channel.weight, 0);
		let roll = Math.random() * total;
		const index = pool.findIndex((channel) => {
			roll -= channel.weight;
			return roll <= 0;
		});
		const [selected] = pool.splice(index < 0 ? 0 : index, 1);
		ordered.push(selected);
	}
	return ordered;
}

/**
 * Extracts model entries from a channel record.
 */
export function extractModels(channel: ChannelRecord): ModelEntry[] {
	const raw = safeJsonParse<ModelPayload[] | { data?: ModelPayload[] } | null>(
		channel.models_json,
		null,
	);
	const models = Array.isArray(raw)
		? raw
		: Array.isArray(raw?.data)
			? raw.data
			: [];

	return models
		.filter((model) => model?.id)
		.map((model) => ({
			id: String(model.id),
			label: String(model.id),
			channelId: channel.id,
			channelName: channel.name,
		}));
}
