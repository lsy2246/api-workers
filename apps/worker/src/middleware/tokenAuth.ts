import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { canConsumeQuota, normalizeQuota } from "../services/quota";
import { sha256Hex } from "../utils/crypto";
import { jsonError } from "../utils/http";
import { getBearerToken } from "../utils/request";

export type TokenRecord = {
	id: string;
	name: string;
	quota_total: number | null;
	quota_used: number;
	status: string;
	allowed_channels: string | null;
};

/**
 * Validates API tokens for the OpenAI-compatible proxy.
 */
export const tokenAuth = createMiddleware<AppEnv>(async (c, next) => {
	const token = getBearerToken(c);
	if (!token) {
		return jsonError(c, 401, "token_required", "token_required");
	}

	const tokenHash = await sha256Hex(token);
	const record = await c.env.DB.prepare(
		"SELECT id, name, quota_total, quota_used, status, allowed_channels FROM tokens WHERE key_hash = ?",
	)
		.bind(tokenHash)
		.first<TokenRecord>();

	if (!record) {
		return jsonError(c, 401, "invalid_token", "invalid_token");
	}

	if (record.status !== "active") {
		return jsonError(c, 403, "token_disabled", "token_disabled");
	}

	const quotaTotal =
		record.quota_total === null || record.quota_total === undefined
			? null
			: Number(record.quota_total);
	const quotaUsed = Number(record.quota_used ?? 0);
	const normalized = normalizeQuota(
		Number.isNaN(quotaTotal) ? null : quotaTotal,
		Number.isNaN(quotaUsed) ? 0 : quotaUsed,
	);
	if (!canConsumeQuota(normalized.quotaTotal, normalized.quotaUsed, 1)) {
		return jsonError(c, 402, "quota_exceeded", "quota_exceeded");
	}

	c.set("tokenRecord", {
		...record,
		quota_total: normalized.quotaTotal,
		quota_used: normalized.quotaUsed,
	});
	await next();
});
