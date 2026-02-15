import type { D1Database } from "@cloudflare/workers-types";
import { nowIso } from "../utils/time";

export type UsageInput = {
	tokenId?: string | null;
	channelId?: string | null;
	model?: string | null;
	requestPath?: string | null;
	totalTokens?: number | null;
	promptTokens?: number | null;
	completionTokens?: number | null;
	cost?: number | null;
	latencyMs?: number | null;
	status?: string | null;
};

/**
 * Inserts a usage record and updates token quota.
 */
export async function recordUsage(
	db: D1Database,
	input: UsageInput,
): Promise<void> {
	const id = crypto.randomUUID();
	const createdAt = nowIso();
	await db
		.prepare(
			"INSERT INTO usage_logs (id, token_id, channel_id, model, request_path, total_tokens, prompt_tokens, completion_tokens, cost, latency_ms, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
		.bind(
			id,
			input.tokenId ?? null,
			input.channelId ?? null,
			input.model ?? null,
			input.requestPath ?? null,
			input.totalTokens ?? 0,
			input.promptTokens ?? 0,
			input.completionTokens ?? 0,
			input.cost ?? 0,
			input.latencyMs ?? 0,
			input.status ?? "ok",
			createdAt,
		)
		.run();

	if (input.tokenId && input.totalTokens) {
		await db
			.prepare(
				"UPDATE tokens SET quota_used = quota_used + ?, updated_at = ? WHERE id = ?",
			)
			.bind(input.totalTokens, createdAt, input.tokenId)
			.run();
	}
}

/**
 * Deletes usage logs older than the retention window.
 */
export async function pruneUsageLogs(
	db: D1Database,
	retentionDays: number,
): Promise<void> {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - retentionDays);
	await db
		.prepare("DELETE FROM usage_logs WHERE created_at < ?")
		.bind(cutoff.toISOString())
		.run();
}
