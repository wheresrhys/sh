import { parseAmount } from "./scraperUtils";

describe("parseAmount", () => {
  it("should handle simple number formats", () => {
    expect(parseAmount("123")).toEqual(123);
    expect(parseAmount("1234.5")).toEqual(1234.5);
    expect(parseAmount("0.1234")).toEqual(0.1234);
  });

  it("should handle numbers with thousand separators", () => {
    expect(parseAmount("12,345")).toEqual(12345);
    expect(parseAmount("1,234.5")).toEqual(1234.5);
  });
  it("should handle numbers with currency", () => {
    expect(parseAmount("£12,345")).toEqual(12345);
    expect(parseAmount("£1,234.5")).toEqual(1234.5);
  });

  it("should handle negative numbers ", () => {
    expect(parseAmount("-12345")).toEqual(-12345);
    expect(parseAmount("-1234.5")).toEqual(-1234.5);
  });
});
