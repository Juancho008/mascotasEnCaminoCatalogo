import { motion } from "framer-motion";

export default function CatalogNav({
  groups,
  activeGroupKey,
  activeSubId,
  onSelectGroup,
  onSelectSub,
  searchActive = false,
}) {
  if (!groups?.length) return null;

  const activeGroup =
    groups.find((g) => g.key === activeGroupKey) || groups[0];

  if (searchActive) {
    return (
      <nav className="catalog-nav" aria-label="Catálogo">
        <div className="catalog-nav-inner">
          <p className="catalog-nav-search-hint">🔍 Mostrando resultados en todo el catálogo</p>
        </div>
      </nav>
    );
  }

  return (
    <nav className="catalog-nav" aria-label="Catálogo">
      <div className="catalog-nav-inner">
        <div className="catalog-nav-row catalog-nav-groups">
          {groups.map((group) => (
            <motion.button
              key={group.key}
              type="button"
              className={`chip chip-lg ${
                activeGroupKey === group.key ? "chip-active" : ""
              }`}
              onClick={() => onSelectGroup(group.key)}
              whileTap={{ scale: 0.96 }}
            >
              <span className="chip-emoji">{group.emoji}</span>
              {group.label}
            </motion.button>
          ))}
        </div>

        {activeGroup?.hasMultiple && (
          <div className="catalog-nav-row catalog-nav-subs">
            {activeGroup.categories.map((cat) => (
              <motion.button
                key={cat.id}
                type="button"
                className={`chip chip-sub ${
                  activeSubId === cat.id ? "chip-active" : ""
                }`}
                onClick={() => onSelectSub(cat.id)}
                whileTap={{ scale: 0.96 }}
              >
                <span className="chip-emoji">{cat.emoji}</span>
                {cat.label}
                <span className="chip-count">{cat.products.length}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
