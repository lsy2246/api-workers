import type { D1Database } from "@cloudflare/workers-types";
import { nowIso } from "../utils/time";
import { normalizeBaseUrl } from "../utils/url";
import { normalizeModelsInput, modelsToJson } from "./channel-models";

export type ChannelTestResult = {
	ok: boolean;
	elapsed: number;
	models: string[];
	payload?: unknown[] | { data?: unknown[] };
};

export async function fetchChannelModels(
	baseUrl: string,
	apiKey: string,
): Promise<ChannelTestResult> {
	const target = `${normalizeBaseUrl(baseUrl)}/v1/models`;
	const start = Date.now();
	const response = await fetch(target, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"x-api-key": apiKey,
			"Content-Type": "application/json",
		},
	});

	const elapsed = Date.now() - start;
	if (!response.ok) {
		return { ok: false, elapsed, models: [] };
	}

	const payload = (await response.json().catch(() => ({ data: [] }))) as
		| { data?: unknown[] }
		| unknown[];
	const models = normalizeModelsInput(
		Array.isArray(payload) ? payload : (payload.data ?? payload),
	);
	return { ok: true, elapsed, models, payload };
}

export async function updateChannelTestResult(
	db: D1Database,
	id: string,
	result: {
		ok: boolean;
		elapsed: number;
		models?: string[];
		modelsJson?: string;
	},
): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	const status = result.ok ? "active" : "error";
	const modelsJson =
		result.modelsJson ?? (result.models ? modelsToJson(result.models) : undefined);
	const sql = modelsJson
		? "UPDATE channels SET status = ?, models_json = ?, test_time = ?, response_time_ms = ?, updated_at = ? WHERE id = ?"
		: "UPDATE channels SET status = ?, test_time = ?, response_time_ms = ?, updated_at = ? WHERE id = ?";

	const stmt = db.prepare(sql);
	if (modelsJson) {
		await stmt.bind(status, modelsJson, now, result.elapsed, nowIso(), id).run();
	} else {
		await stmt.bind(status, now, result.elapsed, nowIso(), id).run();
	}
}
