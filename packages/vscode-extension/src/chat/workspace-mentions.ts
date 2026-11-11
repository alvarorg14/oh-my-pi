import type { WorkspaceMention } from "../protocol";

/** Format a path so OMP's mention parser resolves it exactly. */
export function formatWorkspaceMention(relative: string): string | undefined {
	const quote = relative.includes('"') ? "'" : '"';
	if (relative.includes('"') && relative.includes("'")) return undefined;
	return /[\s@'"]/.test(relative) ||
		/^[\x60\x22\x27([{<]/.test(relative) ||
		/[)\]}>.,;:!?\x22\x27\x60]$/.test(relative)
		? `@${quote}${relative}${quote}`
		: `@${relative}`;
}

/** Filter and rank by project path while preserving duplicate names in different folders. */
export function rankWorkspaceMentions(entries: WorkspaceMention[], query: string): WorkspaceMention[] {
	const needle = query.toLowerCase();
	const unique = new Map(entries.map(entry => [entry.mention, entry]));
	const matches = [...unique.values()].filter(entry => entry.path.toLowerCase().includes(needle));
	matches.sort((a, b) => {
		const prefix = Number(b.name.toLowerCase().startsWith(needle)) - Number(a.name.toLowerCase().startsWith(needle));
		return prefix || a.path.localeCompare(b.path);
	});
	return matches.slice(0, 50);
}
