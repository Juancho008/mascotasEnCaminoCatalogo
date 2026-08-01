import { describe, expect, it } from "vitest";
import { mockCatalog } from "./catalog.mock";

describe("mockCatalog", () => {
  it("expone datos atómicos reutilizables", () => {
    expect(mockCatalog.site.storeName).toBe("Mascotas en Camino");
    expect(mockCatalog.categories.length).toBeGreaterThan(0);
    expect(mockCatalog.categories[0].products.length).toBeGreaterThan(0);
  });

  it("incluye alimento balanceado agrupado", () => {
    const balanced = mockCatalog.categories.find((c) => c.groupId === "alimento-balanceado");
    expect(balanced).toBeDefined();
  });
});
