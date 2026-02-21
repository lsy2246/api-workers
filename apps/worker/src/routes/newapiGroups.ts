import { Hono } from "hono";
import type { AppEnv } from "../env";
import { newApiAuth } from "../middleware/newApiAuth";
import { newApiSuccess } from "../utils/newapi-response";

const groups = new Hono<AppEnv>({ strict: false });
groups.use("*", newApiAuth);

function collectGroups(rows: Array<{ group_name?: string | null }>): string[] {
	const names = new Set<string>();
	for (const row of rows) {
		const raw = row.group_name;
		if (!raw) {
			continue;
		}
		raw
			.split(",")
			.map((item) => item.trim())
			.filter((item) => item.length > 0)
			.forEach((item) => {
				names.add(item);
			});
	}
	if (names.size === 0) {
		names.add("default");
	}
	return Array.from(names).sort((a, b) => a.localeCompare(b));
}

groups.get("/", async (c) => {
	const result = await c.env.DB.prepare(
		"SELECT group_name FROM channels",
	).all();
	const data = collectGroups(
		(result.results ?? []) as Array<{ group_name?: string | null }>,
	);
	return newApiSuccess(c, data);
});

export default groups;
