import { safeJsonParse } from "./json";

export type NormalizedUsage = {
	totalTokens: number;
	promptTokens: number;
	completionTokens: number;
};

function toNumber(value: unknown): number | null {
	if (value === null || value === undefined) {
		return null;
	}
	const num = Number(value);
	return Number.isFinite(num) ? num : null;
}

function pickNumber(...values: Array<unknown>): number | null {
	for (const value of values) {
		const parsed = toNumber(value);
		if (parsed !== null) {
			return parsed;
		}
	}
	return null;
}

export function normalizeUsage(raw: unknown): NormalizedUsage | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}
	const data = raw as Record<string, unknown>;
	const promptTokens = pickNumber(
		data.prompt_tokens,
		data.promptTokens,
		data.input_tokens,
		data.inputTokens,
	);
	const completionTokens = pickNumber(
		data.completion_tokens,
		data.completionTokens,
		data.output_tokens,
		data.outputTokens,
	);
	let totalTokens = pickNumber(
		data.total_tokens,
		data.totalTokens,
		data.total,
		data.tokens,
		data.token_count,
	);
	if (
		totalTokens === null &&
		(promptTokens !== null || completionTokens !== null)
	) {
		totalTokens = (promptTokens ?? 0) + (completionTokens ?? 0);
	}
	if (totalTokens === null) {
		return null;
	}
	return {
		totalTokens,
		promptTokens: promptTokens ?? 0,
		completionTokens: completionTokens ?? 0,
	};
}

export function parseUsageFromJson(payload: unknown): NormalizedUsage | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}
	const data = payload as Record<string, unknown>;
	const usage =
		data.usage ??
		(data.data && typeof data.data === "object"
			? (data.data as Record<string, unknown>).usage
			: null);
	return normalizeUsage(usage);
}

export function parseUsageFromHeaders(
	headers: Headers,
): NormalizedUsage | null {
	const jsonHeader = headers.get("x-usage") ?? headers.get("x-openai-usage");
	if (jsonHeader) {
		const parsed = safeJsonParse<unknown>(jsonHeader, null);
		const normalized = normalizeUsage(parsed);
		if (normalized) {
			return normalized;
		}
	}

	const totalTokens = pickNumber(
		headers.get("x-usage-total-tokens"),
		headers.get("x-openai-usage-total-tokens"),
	);
	const promptTokens = pickNumber(
		headers.get("x-usage-prompt-tokens"),
		headers.get("x-openai-usage-prompt-tokens"),
	);
	const completionTokens = pickNumber(
		headers.get("x-usage-completion-tokens"),
		headers.get("x-openai-usage-completion-tokens"),
	);

	if (
		totalTokens === null &&
		promptTokens === null &&
		completionTokens === null
	) {
		return null;
	}

	return {
		totalTokens: totalTokens ?? (promptTokens ?? 0) + (completionTokens ?? 0),
		promptTokens: promptTokens ?? 0,
		completionTokens: completionTokens ?? 0,
	};
}

export async function parseUsageFromSse(
	response: Response,
): Promise<NormalizedUsage | null> {
	if (!response.body) {
		return null;
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let usage: NormalizedUsage | null = null;

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		buffer += decoder.decode(value, { stream: true });
		let newlineIndex = buffer.indexOf("\n");
		while (newlineIndex !== -1) {
			const line = buffer.slice(0, newlineIndex).trim();
			buffer = buffer.slice(newlineIndex + 1);
			if (line.startsWith("data:")) {
				const payload = line.slice(5).trim();
				if (payload && payload !== "[DONE]") {
					const parsed = safeJsonParse<unknown>(payload, null);
					const candidate = parseUsageFromJson(parsed);
					if (candidate) {
						usage = candidate;
					}
				}
			}
			newlineIndex = buffer.indexOf("\n");
		}
	}

	const remaining = buffer.trim();
	if (remaining.startsWith("data:")) {
		const payload = remaining.slice(5).trim();
		if (payload && payload !== "[DONE]") {
			const parsed = safeJsonParse<unknown>(payload, null);
			const candidate = parseUsageFromJson(parsed);
			if (candidate) {
				usage = candidate;
			}
		}
	}

	return usage;
}
