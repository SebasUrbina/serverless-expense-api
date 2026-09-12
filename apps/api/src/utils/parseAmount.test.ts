import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAmount } from "./parseAmount";

describe("parseAmount", () => {
	it("keeps numeric amounts", () => {
		assert.equal(parseAmount(2300), 2300);
	});

	it("accepts iOS and Chilean currency strings", () => {
		assert.equal(parseAmount("$2.300"), 2300);
		assert.equal(parseAmount("$ 2.300"), 2300);
		assert.equal(parseAmount("2.300,50 CLP"), 2300.5);
	});

	it("accepts quoted numbers and one number embedded in text", () => {
		assert.equal(parseAmount("'2300'"), 2300);
		assert.equal(parseAmount('"2300"'), 2300);
		assert.equal(parseAmount("Monto: $2.300 CLP"), 2300);
	});

	it("supports common international separator combinations", () => {
		assert.equal(parseAmount("$2,300.50"), 2300.5);
		assert.equal(parseAmount("$2.300,50"), 2300.5);
		assert.equal(parseAmount("1,234,567"), 1234567);
	});

	it("rejects empty, non-numeric, and ambiguous strings", () => {
		assert.equal(Number.isNaN(parseAmount("")), true);
		assert.equal(Number.isNaN(parseAmount("sin monto")), true);
		assert.equal(Number.isNaN(parseAmount("2 pagos de 2300")), true);
	});
});
