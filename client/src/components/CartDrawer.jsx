import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext.jsx";
import { buildWhatsAppLink, formatPrice } from "../utils.js";

export default function CartDrawer({ open, onClose, site }) {
  const { items, totalItems, totalPrice, increment, decrement, removeItem, clear } =
    useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;
    const url = buildWhatsAppLink(site, items, totalPrice);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    // Si el navegador bloquea la pestaña nueva (popup blocker, móviles, etc.),
    // abrimos WhatsApp en la misma pestaña como respaldo.
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = url;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            role="dialog"
            aria-label="Carrito de compras"
          >
            <div className="cart-header">
              <h2>
                Tu pedido{" "}
                {totalItems > 0 && <span className="cart-count">({totalItems})</span>}
              </h2>
              <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="cart-items">
              {items.length === 0 ? (
                <div className="cart-empty">
                  <motion.p
                    className="cart-empty-emoji"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🛒
                  </motion.p>
                  <p>Tu carrito está vacío</p>
                  <span>¡Agregá productos para tu mascota! 🐾</span>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      className="cart-item"
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <img className="cart-item-img" src={item.image} alt={item.name} />
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">
                          {item.price > 0 ? formatPrice(item.price, site) : "Consultar"}
                        </span>
                        <div className="qty-control">
                          <button onClick={() => decrement(item.id)} aria-label="Quitar uno">
                            −
                          </button>
                          <span>{item.qty}</span>
                          <button onClick={() => increment(item.id)} aria-label="Agregar uno">
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Eliminar ${item.name}`}
                      >
                        🗑️
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {items.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <strong>{formatPrice(totalPrice, site)}</strong>
                </div>
                <motion.button
                  className="checkout-btn"
                  onClick={handleCheckout}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="wa-icon">💬</span> Pedir por WhatsApp
                </motion.button>
                <button className="clear-btn" onClick={clear}>
                  Vaciar carrito
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
