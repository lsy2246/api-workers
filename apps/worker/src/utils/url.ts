/**
 * Normalizes upstream base URLs and strips a trailing /v1 segment.
 *
 * Args:
 *   baseUrl: Raw upstream base URL.
 *
 * Returns:
 *   Normalized base URL without trailing slashes or /v1.
 */
export function normalizeBaseUrl(baseUrl: string): string {
	if (!baseUrl) {
		return "";
	}
	const trimmed = baseUrl.trim().replace(/\/+$/, "");
	return trimmed.replace(/\/v1$/i, "");
}
