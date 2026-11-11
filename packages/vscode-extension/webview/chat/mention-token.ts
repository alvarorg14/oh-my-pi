/** Find the active OMP mention at the caret. */
export function mentionToken(value: string, cursor: number): { start: number; query: string } | undefined {
	const match = /(^|[\s([{<"'`])@([^\s@]*)$/.exec(value.slice(0, cursor));
	if (!match) return undefined;
	return { start: match.index + match[1]!.length, query: match[2]! };
}

/** Replace the active token, leaving surrounding text and line breaks intact. */
export function replaceMention(
	value: string,
	cursor: number,
	mention: string,
): { value: string; cursor: number } | undefined {
	const token = mentionToken(value, cursor);
	if (!token) return undefined;
	const end = cursor + (/^[^\s@]*/.exec(value.slice(cursor))?.[0].length ?? 0);
	const suffix = value.slice(end);
	const inserted = mention + (!suffix || !/^\s/.test(suffix) ? " " : "");
	return {
		value: value.slice(0, token.start) + inserted + suffix,
		cursor: token.start + inserted.length,
	};
}
