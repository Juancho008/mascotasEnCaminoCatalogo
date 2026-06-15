export function formatPrice(value, site) {
  const { currency = "$", currencyPosition = "before", locale = "es-AR" } =
    site || {};
  let number;
  try {
    number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    number = String(value ?? 0);
  }
  return currencyPosition === "after"
    ? `${number} ${currency}`
    : `${currency}${number}`;
}

/** Construye el enlace de WhatsApp con el detalle del pedido. */
export function buildWhatsAppLink(site, items, totalPrice) {
  const number = (site.whatsappNumber || "").replace(/\D/g, "");
  const lines = [];

  if (site.whatsappMessageHeader) lines.push(site.whatsappMessageHeader, "");

  items.forEach((item) => {
    lines.push(
      `• ${item.qty}x ${item.name} — ${formatPrice(item.price * item.qty, site)}`
    );
  });

  lines.push("", `*Total: ${formatPrice(totalPrice, site)}*`);

  if (site.whatsappMessageFooter) lines.push("", site.whatsappMessageFooter);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${number}?text=${text}`;
}
