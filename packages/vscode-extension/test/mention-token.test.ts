import { describe, expect, test } from "bun:test";
import { mentionToken } from "../webview/chat/mention-token";

describe("workspace mention detection", () => {
	test("finds a mention at the caret inside a longer draft", () => {
		expect(mentionToken("Please check @src/fo and explain", 20)).toEqual({ start: 13, query: "src/fo" });
	});
	test("does not treat an email address as a mention", () => {
		expect(mentionToken("mail user@example.com", 21)).toBeUndefined();
	});
});
