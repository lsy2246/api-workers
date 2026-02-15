import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Sends a JSON error response with a consistent shape.
 */
export function jsonError(
	c: Context,
	status: ContentfulStatusCode,
	message: string,
	code?: string,
) {
	return c.json(
		{
			error: message,
			code,
		},
		status,
	);
}
