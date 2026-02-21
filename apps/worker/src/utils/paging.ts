export function normalizePage(
	value: string | undefined | null,
	fallback: number,
): number {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return fallback;
	}
	return Math.floor(parsed);
}

export function normalizePageSize(
	value: string | undefined | null,
	fallback: number,
): number {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return fallback;
	}
	return Math.min(200, Math.floor(parsed));
}

export function normalizeStatusFilter(
	value: string | undefined | null,
): string | null {
	if (!value) {
		return null;
	}
	const normalized = value.trim().toLowerCase();
	if (normalized === "all") {
		return null;
	}
	if (["enabled", "enable", "1", "active"].includes(normalized)) {
		return "active";
	}
	if (["disabled", "disable", "0", "2", "inactive"].includes(normalized)) {
		return "disabled";
	}
	return null;
}

export function normalizeBoolean(value: string | undefined | null): boolean {
	if (!value) {
		return false;
	}
	const normalized = value.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}
