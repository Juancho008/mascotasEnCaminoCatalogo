import { motion } from "framer-motion";

export default function CategoryNav({ categories, active, onSelect }) {
  if (!categories || categories.length <= 1) return null;

  const handleClick = (id) => {
    onSelect(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="category-nav">
      <div className="category-nav-inner">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            className={`chip ${active === cat.id ? "chip-active" : ""}`}
            onClick={() => handleClick(cat.id)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ y: -2 }}
          >
            <span className="chip-emoji">{cat.emoji}</span>
            {cat.label}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
