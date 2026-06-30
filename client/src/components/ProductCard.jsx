import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils.js";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 16 } },
};

const tagLabels = {
  nuevo: "Nuevo",
  destacado: "Destacado",
  oferta: "Oferta",
};

export default function ProductCard({ product, site }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };

  const isAvailable = product.available !== false;

  return (
    <motion.article
      className="card"
      variants={cardVariants}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      itemScope
      itemType="https://schema.org/Product"
    >
      <div className="card-image-wrap">
        <img
          className="card-image"
          src={product.image}
          alt={product.name}
          loading="lazy"
          itemProp="image"
        />
        {product.tags?.length > 0 && (
          <div className="card-tags">
            {product.tags.map((t) => (
              <span key={t} className={`tag tag-${t}`}>
                {tagLabels[t] || t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-name" itemProp="name">
          {product.name}
        </h3>
        {product.description && (
          <p className="card-desc">{product.description}</p>
        )}

        <div className="card-footer">
          <span className="card-price" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="priceCurrency" content="ARS" />
            {product.price > 0 ? (
              <>
                <meta itemProp="price" content={String(product.price)} />
                {formatPrice(product.price, site)}
              </>
            ) : (
              "Consultar"
            )}
          </span>

          <motion.button
            className={`add-btn ${added ? "add-btn-done" : ""}`}
            onClick={handleAdd}
            disabled={!isAvailable}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="done"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  ✓ Agregado
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  + Agregar al carrito
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
