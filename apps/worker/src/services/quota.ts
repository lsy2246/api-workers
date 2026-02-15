/**
 * Determines whether a token can consume more quota.
 */
export function canConsumeQuota(
	quotaTotal: number | null,
	quotaUsed: number,
	increment: number,
): boolean {
	if (quotaTotal === null || quotaTotal === undefined) {
		return true;
	}
	return quotaUsed + increment <= quotaTotal;
}

/**
 * Normalizes quota numbers to safe values.
 */
export function normalizeQuota(
	quotaTotal?: number | null,
	quotaUsed?: number | null,
) {
	return {
		quotaTotal: quotaTotal ?? null,
		quotaUsed: quotaUsed ?? 0,
	};
}
