import { Hono } from "hono";
import type { AppEnv } from "../env";
import { type TokenRecord, tokenAuth } from "../middleware/tokenAuth";
import {
	type ChannelRecord,
	createWeightedOrder,
	extractModels,
} from "../services/channels";
import { recordUsage } from "../services/usage";
import { jsonError } from "../utils/http";
import { safeJsonParse } from "../utils/json";
import { normalizeBaseUrl } from "../utils/url";
import {
	type NormalizedUsage,
	parseUsageFromHeaders,
	parseUsageFromJson,
	parseUsageFromSse,
} from "../utils/usage";

const proxy = new Hono<AppEnv>();

type ExecutionContextLike = {
	waitUntil: (promise: Promise<unknown>) => void;
};

function channelSupportsModel(
	channel: ChannelRecord,
	model?: string | null,
): boolean {
	if (!model) {
		return true;
	}
	const models = extractModels(channel);
	return models.some((entry) => entry.id === model);
}

function filterAllowedChannels(
	channels: ChannelRecord[],
	tokenRecord: TokenRecord,
): ChannelRecord[] {
	const allowed = safeJsonParse<string[] | null>(
		tokenRecord.allowed_channels,
		null,
	);
	if (!allowed || allowed.length === 0) {
		return channels;
	}
	const allowedSet = new Set(allowed);
	return channels.filter((channel) => allowedSet.has(channel.id));
}

/**
 * Determines whether a response status should be retried.
 *
 * Args:
 *   status: HTTP response status code.
 *
 * Returns:
 *   True if the status is retryable.
 */
function isRetryableStatus(status: number): boolean {
	return status === 408 || status === 429 || status >= 500;
}

/**
 * Waits before the next retry round.
 *
 * Args:
 *   ms: Delay in milliseconds.
 *
 * Returns:
 *   Promise resolved after delay.
 */
async function sleep(ms: number): Promise<void> {
	if (ms <= 0) {
		return;
	}
	await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * OpenAI-compatible proxy handler.
 */
proxy.all("/*", tokenAuth, async (c) => {
	const tokenRecord = c.get("tokenRecord") as TokenRecord;
	let requestText = await c.req.text();
	const parsedBody = requestText
		? safeJsonParse<Record<string, unknown> | null>(requestText, null)
		: null;
	const model =
		parsedBody?.model !== undefined && parsedBody?.model !== null
			? String(parsedBody.model)
			: null;
	const isStream = parsedBody?.stream === true;
	if (isStream && parsedBody && typeof parsedBody === "object") {
		const streamOptions = (parsedBody as Record<string, unknown>)
			.stream_options;
		if (!streamOptions || typeof streamOptions !== "object") {
			(parsedBody as Record<string, unknown>).stream_options = {
				include_usage: true,
			};
		} else if (
			(streamOptions as Record<string, unknown>).include_usage !== true
		) {
			(streamOptions as Record<string, unknown>).include_usage = true;
		}
		requestText = JSON.stringify(parsedBody);
	}

	const channelResult = await c.env.DB.prepare(
		"SELECT * FROM channels WHERE status = ?",
	)
		.bind("active")
		.all();
	const activeChannels = (channelResult.results ?? []) as ChannelRecord[];
	const allowedChannels = filterAllowedChannels(activeChannels, tokenRecord);
	const modelChannels = allowedChannels.filter((channel) =>
		channelSupportsModel(channel, model),
	);
	const candidates = modelChannels.length > 0 ? modelChannels : allowedChannels;

	if (candidates.length === 0) {
		return jsonError(c, 503, "no_available_channels", "no_available_channels");
	}

	const ordered = createWeightedOrder(candidates);
	const targetPath = c.req.path;
	const retryRounds = Math.max(1, Number(c.env.PROXY_RETRY_ROUNDS ?? "1"));
	const retryDelayMs = Math.max(0, Number(c.env.PROXY_RETRY_DELAY_MS ?? "200"));
	let lastResponse: Response | null = null;
	let lastChannel: ChannelRecord | null = null;
	const start = Date.now();
	let selectedChannel: ChannelRecord | null = null;

	let round = 0;
	while (round < retryRounds && !selectedChannel) {
		let shouldRetry = false;
		for (const channel of ordered) {
			lastChannel = channel;
			const target = `${normalizeBaseUrl(channel.base_url)}${targetPath}${c.req.url.includes("?") ? `?${c.req.url.split("?")[1]}` : ""}`;
			const headers = new Headers(c.req.header());
			headers.set("Authorization", `Bearer ${channel.api_key}`);
			headers.set("x-api-key", String(channel.api_key));
			headers.delete("host");
			headers.delete("content-length");

			try {
				const response = await fetch(target, {
					method: c.req.method,
					headers,
					body: requestText || undefined,
				});

				lastResponse = response;
				if (response.ok) {
					selectedChannel = channel;
					break;
				}

				if (isRetryableStatus(response.status)) {
					shouldRetry = true;
				}
			} catch {
				lastResponse = null;
				shouldRetry = true;
			}
		}

		if (selectedChannel || !shouldRetry) {
			break;
		}

		round += 1;
		if (round < retryRounds) {
			await sleep(retryDelayMs);
		}
	}

	const latencyMs = Date.now() - start;

	if (!lastResponse) {
		await recordUsage(c.env.DB, {
			tokenId: tokenRecord.id,
			model,
			requestPath: targetPath,
			totalTokens: 0,
			latencyMs,
			status: "error",
		});
		return jsonError(c, 502, "upstream_unavailable", "upstream_unavailable");
	}

	const channelForUsage = selectedChannel ?? lastChannel;
	if (channelForUsage && lastResponse) {
		const record = async (usage: NormalizedUsage | null) => {
			const normalized = usage ?? {
				totalTokens: 0,
				promptTokens: 0,
				completionTokens: 0,
			};
			await recordUsage(c.env.DB, {
				tokenId: tokenRecord.id,
				channelId: channelForUsage.id,
				model,
				requestPath: targetPath,
				totalTokens: normalized.totalTokens,
				promptTokens: normalized.promptTokens,
				completionTokens: normalized.completionTokens,
				cost: 0,
				latencyMs,
				status: lastResponse.ok ? "ok" : "error",
			});
		};
		const logUsage = (
			label: string,
			usage: NormalizedUsage | null,
			source: string,
		) => {
			console.log(`[usage] ${label}`, {
				source,
				total_tokens: usage?.totalTokens ?? 0,
				prompt_tokens: usage?.promptTokens ?? 0,
				completion_tokens: usage?.completionTokens ?? 0,
				stream: isStream,
				status: lastResponse.status,
				model,
				path: targetPath,
			});
		};

		const headerUsage = parseUsageFromHeaders(lastResponse.headers);
		let jsonUsage: NormalizedUsage | null = null;
		if (
			!isStream &&
			lastResponse.ok &&
			lastResponse.headers.get("content-type")?.includes("application/json")
		) {
			const data = await lastResponse
				.clone()
				.json()
				.catch(() => null);
			jsonUsage = parseUsageFromJson(data);
		}
		const immediateUsage = jsonUsage ?? headerUsage;
		const immediateSource = jsonUsage
			? "json"
			: headerUsage
				? "header"
				: "none";

		if (isStream && !immediateUsage) {
			const executionCtx = (c as { executionCtx?: ExecutionContextLike })
				.executionCtx;
			const task = parseUsageFromSse(lastResponse.clone())
				.then((streamUsage) => {
					logUsage("stream", streamUsage, streamUsage ? "sse" : "sse-none");
					return record(streamUsage);
				})
				.catch(() => undefined);
			if (executionCtx?.waitUntil) {
				executionCtx.waitUntil(task);
			} else {
				task.catch(() => undefined);
			}
		} else {
			logUsage("immediate", immediateUsage, immediateSource);
			await record(immediateUsage);
		}
	}

	return lastResponse;
});

export default proxy;
