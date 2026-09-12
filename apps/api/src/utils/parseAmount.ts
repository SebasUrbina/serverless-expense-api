const NUMBER_IN_TEXT = /[-+]?\d[\d\s.,'’]*/g;

/**
 * Extracts one monetary value from numbers or human-formatted strings.
 *
 * Dots keep the existing Chilean thousands-separator behavior, while a comma
 * remains a decimal separator. If both separators are present, the last one
 * is treated as the decimal separator.
 */
export function parseAmount(value: unknown): unknown {
	if (typeof value === "number") return value;
	if (typeof value !== "string" || value.trim() === "") return Number.NaN;

	const matches = value.match(NUMBER_IN_TEXT)?.map((match) => match.trim()) ?? [];
	if (matches.length !== 1) return Number.NaN;

	let numeric = matches[0].replace(/[\s'’]/g, "");
	const lastDot = numeric.lastIndexOf(".");
	const lastComma = numeric.lastIndexOf(",");

	if (lastDot >= 0 && lastComma >= 0) {
		const decimalSeparator = lastDot > lastComma ? "." : ",";
		const thousandsSeparator = decimalSeparator === "." ? "," : ".";
		numeric = numeric.replaceAll(thousandsSeparator, "");
		if (decimalSeparator === ",") numeric = numeric.replace(",", ".");
	} else if (lastDot >= 0) {
		// Preserve the endpoint's existing es-CL behavior: 2.300 means 2300.
		numeric = numeric.replaceAll(".", "");
	} else if (lastComma >= 0) {
		const commaCount = numeric.length - numeric.replaceAll(",", "").length;
		if (commaCount === 1) {
			numeric = numeric.replace(",", ".");
		} else {
			const groups = numeric.replace(/^[+-]/, "").split(",");
			if (groups.slice(1).every((group) => group.length === 3)) {
				numeric = numeric.replaceAll(",", "");
			} else {
				return Number.NaN;
			}
		}
	}

	return Number(numeric);
}
