import { motion } from "framer-motion";
import ProductCard from "./ProductCard.jsx";

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

export default function CategorySection({ category, site, isSubcategory = false }) {
  return (
    <section
      className={`category-section${isSubcategory ? " category-section-sub" : ""}`}
      id={`cat-${category.id}`}
    >
      <motion.div
        className="category-head"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className={`category-title${isSubcategory ? " category-title-sub" : ""}`}>
          <span className="category-emoji">{category.emoji}</span>
          {category.label}
        </h2>
        {category.description && (
          <p className="category-desc">{category.description}</p>
        )}
      </motion.div>

      <motion.div
        className="product-grid"
        variants={gridVariants}
        initial="hidden"
        animate="show"
      >
        {category.products.map((product) => (
          <ProductCard key={product.id} product={product} site={site} />
        ))}
      </motion.div>
    </section>
  );
}
