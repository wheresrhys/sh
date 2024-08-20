/**
 * Converts text containing a monetary amount into a number.
 * Throws if the text can't be parsed
 *
 * @param text - text representation of the amount
 * @returns extracted amount as a number
 */
export function parseAmount(text: string): number {
  // Have split into 2 regex as it's more comprehensible and easier to comment,
  // but could easily be put into a single regex using `|`
  const amount = Number.parseFloat(
    text
      // Replace currency symbol
      // For production code I would put more thought into all the different ways
      // currency can be represented (e.g. is it always a single character at the start?)
      // write tests for these cases and implement something a bit more specific to the task
      .replace(/^[^\d-]/, "")
      .replace(/,/g, ""),
  );
  if (isNaN(amount)) {
    throw new Error(`Invalid amount format: ${text}.`);
  }
  return amount;
}
