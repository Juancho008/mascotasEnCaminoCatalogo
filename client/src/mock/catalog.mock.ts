import type { Catalog } from "../types";

/** Catálogo de prueba — reemplazable por API real vía Redux thunk. */
export const mockCatalog: Catalog = {
  site: {
    storeName: "Mascotas en Camino",
    tagline: "Productos con amor para tu mejor amigo",
    whatsappNumber: "5493764660481",
    whatsappMessageHeader: "¡Hola! 🐾 Quiero hacer este pedido desde el catálogo:",
    whatsappMessageFooter: "¿Me confirman disponibilidad y forma de pago? ¡Gracias! 💙",
    currency: "$",
    currencyPosition: "before",
    locale: "es-AR",
    logo: "/images/Logo/LogoMascotaEnCamino.png",
    theme: {
      primary: "#E23B3B",
      secondary: "#1F3A5F",
      accent: "#FF8FA3",
      background: "#FFF7F1",
      surface: "#FFFFFF",
      text: "#243447",
      muted: "#7A8AA0",
    },
  },
  categories: [
    {
      id: "collares",
      label: "Collares",
      emoji: "🦴",
      description: "Collares cómodos y resistentes para paseos seguros",
      order: 1,
      products: [
        {
          id: "collares/collar-1",
          name: "Collar Clásico Rojo",
          price: 4500,
          description: "Collar resistente ideal para paseos largos.",
          image: "/images/Logo/LogoMascotaEnCamino.png",
          category: "collares",
          tags: ["nuevo"],
          available: true,
        },
        {
          id: "collares/collar-2",
          name: "Collar Acolchado Azul",
          price: 5200,
          description: "Tejido suave que cuida el cuello de tu mascota.",
          image: "/images/Logo/LogoMascotaEnCamino.png",
          category: "collares",
          available: true,
        },
      ],
    },
    {
      id: "estampa",
      label: "ESTAMPA",
      emoji: "🥫",
      group: "Alimento balanceado",
      groupId: "alimento-balanceado",
      order: 2,
      products: [
        {
          id: "estampa/330",
          name: "ESTAMPA ADULTOS CRIADORES X 15KG",
          price: 40000,
          description: "Código 330",
          image: "/images/Logo/LogoMascotaEnCamino.png",
          category: "estampa",
          code: "330",
          available: true,
        },
      ],
    },
  ],
  documents: [],
  generatedAt: new Date().toISOString(),
};
