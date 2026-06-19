import { parsePriceListText } from "../lib/pdf-price-parser.mjs";

const sample = `MOLINO SEDA
LINEA ESTAMPA
330 ESTAMPA ADULTOS CRIADORES X 15KG 34900.000
877 ESTAMPA ADULTOS CRIADORES X 20KG 44900.000
ESTAMPA INSIGNIA
2174 ESTAMPA INSIGNIA PERROS ADULTOS X 15KG 59000.000
LINEA VAGONETA
433 VAGONETA CACHORROS X 1,5KG 4600.000
LINEA DR PERROT / VALIANT
414 DR. PERROT X 1,5KG 2800.000`;

const r = parsePriceListText(sample);
console.log("brand:", r.brand);
console.log("total:", r.totalProducts);
for (const c of r.categories) {
  console.log(`- ${c.label}: ${c.products.length} productos`);
}
