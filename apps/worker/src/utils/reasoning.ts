type ReasoningInput = Record<string, unknown>;

function readEffort(value: unknown): string | number | null {
	if (typeof value === "string" || typeof value === "number") {
		return value;
	}
	return null;
}

/**
 * Extracts reasoning effort from request payloads.
 *
 * Args:
 *   input: Request body payload.
 *
 * Returns:
 *   Reasoning effort value, if present.
 */
export function extractReasoningEffort(input: unknown): string | number | null {
	if (!input || typeof input !== "object") {
		return null;
	}
	const body = input as ReasoningInput;
	const direct = readEffort(body.reasoning_effort ?? body.reasoningEffort);
	if (direct !== null) {
		return direct;
	}
	const reasoning = body.reasoning;
	if (typeof reasoning === "string" || typeof reasoning === "number") {
		return reasoning;
	}
	if (reasoning && typeof reasoning === "object" && !Array.isArray(reasoning)) {
		return readEffort((reasoning as ReasoningInput).effort);
	}
	return null;
}
