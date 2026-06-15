import { motion } from "framer-motion";
import { useCart } from "../context/CartContext.jsx";

export default function Header({ site, onOpenCart, query, onQueryChange }) {
  const { totalItems } = useCart();

  return (
    <header className="header">
      <div className="header-inner">
        <a className="brand" href="#top">
          <img className="brand-logo" src={site.logo} alt={site.storeName} />
          <span className="brand-name">{site.storeName}</span>
        </a>

        <div className="search">
          <span className="search-icon">🔎</span>
          <input
            type="search"
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Buscar productos"
          />
        </div>

        <motion.button
          className="cart-button"
          onClick={onOpenCart}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          aria-label="Abrir carrito"
        >
          <span className="cart-icon">🛒</span>
          <span className="cart-label">Carrito</span>
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              className="cart-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
            >
              {totalItems}
            </motion.span>
          )}
        </motion.button>
      </div>
    </header>
  );
}
