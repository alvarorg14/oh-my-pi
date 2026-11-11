/** A compact mention in a draft and the full OMP mention it represents. */
export interface DraftMention {
	start: number;
	end: number;
	label: string;
	mention: string;
	path: string;
}

/** Keep mentions outside an edit and move those after it to their new positions. */
export function updateDraftMentions(previous: string, next: string, mentions: DraftMention[]): DraftMention[] {
	let start = 0;
	while (start < previous.length && start < next.length && previous[start] === next[start]) start++;
	let oldEnd = previous.length;
	let newEnd = next.length;
	while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) {
		oldEnd--;
		newEnd--;
	}
	const delta = newEnd - oldEnd;
	return mentions.flatMap(mention => {
		if (mention.end <= start) return [mention];
		if (mention.start >= oldEnd) return [{ ...mention, start: mention.start + delta, end: mention.end + delta }];
		return [];
	});
}

/** Expand only intact selected mentions, keeping manually typed text untouched. */
export function expandDraftMentions(draft: string, mentions: DraftMention[]): string {
	let result = draft;
	for (const entry of [...mentions].sort((a, b) => b.start - a.start)) {
		if (draft.slice(entry.start, entry.end) === entry.label) {
			result = result.slice(0, entry.start) + entry.mention + result.slice(entry.end);
		}
	}
	return result;
}
