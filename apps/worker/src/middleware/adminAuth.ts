import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { sha256Hex } from "../utils/crypto";
import { jsonError } from "../utils/http";
import { getBearerToken } from "../utils/request";

/**
 * Validates admin session tokens for management APIs.
 */
export const adminAuth = createMiddleware<AppEnv>(async (c, next) => {
	const token = getBearerToken(c);
	if (!token) {
		return jsonError(c, 401, "admin_token_required", "admin_token_required");
	}

	const tokenHash = await sha256Hex(token);
	const session = await c.env.DB.prepare(
		"SELECT id, expires_at FROM admin_sessions WHERE token_hash = ?",
	)
		.bind(tokenHash)
		.first();

	if (!session) {
		return jsonError(c, 401, "invalid_admin_token", "invalid_admin_token");
	}

	if (new Date(String(session.expires_at)).getTime() <= Date.now()) {
		await c.env.DB.prepare("DELETE FROM admin_sessions WHERE id = ?")
			.bind(String(session.id))
			.run();
		return jsonError(c, 401, "admin_session_expired", "admin_session_expired");
	}

	c.set("adminSessionId", String(session.id));
	await next();
});
