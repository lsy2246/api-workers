export function toInternalStatus(status: unknown): string {
	if (status === undefined || status === null) {
		return "active";
	}
	if (typeof status === "string") {
		const normalized = status.trim().toLowerCase();
		if (["1", "true", "enabled", "enable", "active"].includes(normalized)) {
			return "active";
		}
		if (
			["0", "2", "false", "disabled", "disable", "inactive"].includes(
				normalized,
			)
		) {
			return "disabled";
		}
	}
	if (typeof status === "number") {
		return status === 1 ? "active" : "disabled";
	}
	if (typeof status === "boolean") {
		return status ? "active" : "disabled";
	}
	return "active";
}

export function toNewApiStatus(status: string | null | undefined): number {
	return status === "active" ? 1 : 2;
}
