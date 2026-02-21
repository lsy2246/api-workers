import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function newApiSuccess<T>(c: Context, data?: T, message = "") {
	return c.json(
		{
			success: true,
			message,
			...(data !== undefined ? { data } : {}),
		},
		200,
	);
}

export function newApiFailure(
	c: Context,
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
