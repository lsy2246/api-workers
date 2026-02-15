/**
 * Returns the current ISO timestamp.
 */
export function nowIso(): string {
	return new Date().toISOString();
}

/**
 * Adds hours to a date and returns a new Date.
 */
export function addHours(date: Date, hours: number): Date {
	const copy = new Date(date.getTime());
	copy.setHours(copy.getHours() + hours);
	return copy;
}
