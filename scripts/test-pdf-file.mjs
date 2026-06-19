import fs from "node:fs";
import { createRequire } from "node:module";
import { parsePriceListText } from "../lib/pdf-price-parser.mjs";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const pdfPath =
  process.argv[2] ||
  "C:/Users/SoulX/Downloads/PRECIOS SEDA 30-04-26.PDF";

const buf = fs.readFileSync(pdfPath);
const pdf = await pdfParse(buf);
const parsed = parsePriceListText(pdf.text);

console.log("[test-pdf] Texto extraído:", pdf.text.length, "caracteres");
console.log("[test-pdf] Marca:", parsed.brand || "(sin detectar)");
console.log("[test-pdf] Productos:", parsed.totalProducts);
for (const c of parsed.categories) {
  console.log(`  - ${c.label}: ${c.products.length}`);
}
