import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../env";
import { getAdminPasswordHash } from "../services/settings";
import { sha256Hex } from "../utils/crypto";
import { getBearerToken } from "../utils/request";

function newApiError(
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

function readNewApiUserId(c: Context<AppEnv>): string | null {
	return c.req.header("New-Api-User") ?? c.req.header("new-api-user") ?? null;
}

/**
 * Validates New API admin tokens or admin sessions.
 */
export const newApiAuth = createMiddleware<AppEnv>(async (c, next) => {
	const token = getBearerToken(c);
	if (!token) {
		return newApiError(c, 401, "unauthorized");
	}

	const tokenHash = await sha256Hex(token);
	const adminPasswordHash = await getAdminPasswordHash(c.env.DB);
	if (adminPasswordHash && tokenHash === adminPasswordHash) {
		c.set("newApiUserId", readNewApiUserId(c));
		await next();
		return;
	}

	const session = await c.env.DB.prepare(
		"SELECT id, expires_at FROM admin_sessions WHERE token_hash = ?",
	)
		.bind(tokenHash)
		.first<{ id: string; expires_at: string }>();

	if (!session) {
		return newApiError(c, 401, "unauthorized");
	}

	if (new Date(String(session.expires_at)).getTime() <= Date.now()) {
		await c.env.DB.prepare("DELETE FROM admin_sessions WHERE id = ?")
			.bind(String(session.id))
			.run();
		return newApiError(c, 401, "session_expired");
	}

	c.set("newApiUserId", readNewApiUserId(c));
	await next();
});
