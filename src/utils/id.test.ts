import { expect, it } from "vitest";
import { generateId } from "./id";

it("returns an 8-character base-36 string", () => {
	const id = generateId();
	expect(id).toMatch(/^[a-z0-9]{1,8}$/);
	expect(typeof id).toBe("string");
});
