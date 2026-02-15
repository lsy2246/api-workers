import { Hono } from "hono";
import type { AppEnv } from "../env";
import { newApiAuth } from "../middleware/newApiAuth";
import { type ChannelRow, extractModelIds } from "../services/newapi";

const users = new Hono<AppEnv>({ strict: false });
users.use("*", newApiAuth);

users.get("/models", async (c) => {
	const result = await c.env.DB.prepare(
		"SELECT * FROM channels WHERE status = ?",
	)
		.bind("active")
		.all();
	const models = new Set<string>();
	for (const row of (result.results ?? []) as ChannelRow[]) {
		for (const id of extractModelIds(row)) {
			models.add(id);
		}
	}
	const data = Array.from(models).map((id) => ({ id, name: id }));
	return c.json({
		success: true,
		message: "",
		data,
	});
});

export default users;
