import { afterEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { extractFileMentions, generateFileMentionMessages } from "@oh-my-pi/pi-coding-agent/utils/file-mentions";
import { formatWorkspaceMention, rankWorkspaceMentions } from "../src/chat/workspace-mentions";
import type { WorkspaceMention } from "../src/protocol";
import { replaceMention } from "../webview/chat/mention-token";

const tempDirs: string[] = [];
afterEach(async () => {
	for (const dir of tempDirs.splice(0)) await fs.rm(dir, { recursive: true, force: true });
});

describe("workspace mentions", () => {
	test("inserts project-relative paths without unnecessary quotes", () => {
		expect(formatWorkspaceMention("crates/pi-builtins/README.md")).toBe("@crates/pi-builtins/README.md");
	});
	test("preserves surrounding draft and replaces the whole token at a mid-token caret", () => {
		expect(replaceMention("Review @src/old.ts\nthen explain", 11, '@"/my project/new.ts"')).toEqual({
			value: 'Review @"/my project/new.ts"\nthen explain',
			cursor: 28,
		});
	});

	test("ranks name prefixes and keeps same-named files in different roots", () => {
		const entries: WorkspaceMention[] = [
			{ name: "other.ts", path: "first/src/component-other.ts", kind: "file", mention: "@/one/other.ts" },
			{ name: "Component.ts", path: "second/src/Component.ts", kind: "file", mention: "@/two/Component.ts" },
			{ name: "Component.ts", path: "first/src/Component.ts", kind: "file", mention: "@/one/Component.ts" },
		];
		expect(rankWorkspaceMentions(entries, "comp").map(entry => entry.path)).toEqual([
			"first/src/Component.ts",
			"second/src/Component.ts",
			"first/src/component-other.ts",
		]);
	});

	test("OMP reads project-relative file and folder mentions with spaces", async () => {
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), "maria mentions "));
		tempDirs.push(dir);
		const folder = path.join(dir, "project folder");
		await fs.mkdir(folder);
		const file = path.join(folder, "example file.txt");
		await Bun.write(file, "workspace content");
		const fileMention = formatWorkspaceMention(path.relative(dir, file));
		const folderMention = formatWorkspaceMention(path.relative(dir, folder));
		if (!fileMention || !folderMention) throw new Error("Expected representable paths");
		const paths = extractFileMentions(`Inspect ${fileMention} and ${folderMention}`);
		expect(paths).toEqual(["project folder/example file.txt", "project folder"]);
		const messages = await generateFileMentionMessages(paths, dir);
		const message = messages[0];
		if (message?.role !== "fileMention") throw new Error("Expected file mention context");
		expect(message.files.find(entry => entry.path === paths[0])?.content).toContain("workspace content");
		expect(message.files.find(entry => entry.path === paths[1])?.content).toContain("example file.txt");
	});

	test("formats paths containing either quote for OMP's parser", () => {
		for (const file of ["/project/it's a file.ts", '/project/a "quoted" file.ts']) {
			const mention = formatWorkspaceMention(file);
			if (!mention) throw new Error("Expected representable path");
			expect(extractFileMentions(mention)).toEqual([file]);
		}
	});
});
