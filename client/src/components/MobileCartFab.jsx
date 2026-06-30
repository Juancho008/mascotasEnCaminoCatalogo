import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils.js";

export default function MobileCartFab({ onOpenCart, site }) {
  const { totalItems, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          type="button"
          className="mobile-cart-fab"
          onClick={onOpenCart}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          whileTap={{ scale: 0.97 }}
          aria-label={`Abrir carrito con ${totalItems} productos`}
        >
          <span className="mobile-cart-fab-icon" aria-hidden>
            🛒
          </span>
          <span className="mobile-cart-fab-text">
            Ver carrito · {totalItems} · {formatPrice(totalPrice, site)}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
