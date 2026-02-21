import type { ChannelRecord } from "./channel-types";
import { extractModels } from "./channel-models";

export type { ChannelRecord } from "./channel-types";
export type { ModelEntry } from "./channel-models";
export { extractModels };

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
