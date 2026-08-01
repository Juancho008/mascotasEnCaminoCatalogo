import { describe, expect, it } from "vitest";
import { parseCatalogResponse } from "../services/catalogService";

describe("parseCatalogResponse", () => {
  it("parsea JSON válido del catálogo", () => {
    const catalog = parseCatalogResponse(
      JSON.stringify({
        site: { storeName: "Test" },
        categories: [],
      })
    );

    expect(catalog.site.storeName).toBe("Test");
    expect(catalog.categories).toEqual([]);
  });

  it("rechaza HTML en lugar de JSON", () => {
    expect(() => parseCatalogResponse("<html>error</html>")).toThrow(
      "HTML en lugar de JSON"
    );
  });

  it("rechaza JSON inválido", () => {
    expect(() => parseCatalogResponse("{ no-json")).toThrow("no es JSON válido");
  });
});
