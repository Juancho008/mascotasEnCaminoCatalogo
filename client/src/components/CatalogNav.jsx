import { motion } from "framer-motion";

function shortGroupLabel(label) {
  if (!label) return "";
  if (/alimento/i.test(label)) return "Alimento";
  return label;
}

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
          <p className="catalog-nav-search-hint">
            🔍 Resultados en todo el catálogo
          </p>
        </div>
      </nav>
    );
  }

  return (
    <nav className="catalog-nav" aria-label="Catálogo">
      <div className="catalog-nav-inner">
        <p className="catalog-nav-label">Elegí categoría</p>

        <div
          className="nav-segmented"
          role="tablist"
          aria-label="Categorías principales"
        >
          {groups.map((group) => {
            const active = activeGroupKey === group.key;
            return (
              <motion.button
                key={group.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`nav-tab${active ? " nav-tab-active" : ""}`}
                onClick={() => onSelectGroup(group.key)}
                whileTap={{ scale: 0.98 }}
              >
                <span className="nav-tab-emoji" aria-hidden>
                  {group.emoji}
                </span>
                <span className="nav-tab-text">
                  <span className="nav-tab-full">{group.label}</span>
                  <span className="nav-tab-short">
                    {shortGroupLabel(group.label)}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {activeGroup?.hasMultiple && (
          <div className="catalog-nav-subs-wrap">
            <p className="catalog-nav-label catalog-nav-label-sub">Línea</p>
            <div
              className="catalog-nav-row catalog-nav-subs"
              role="tablist"
              aria-label="Subcategorías"
            >
              {activeGroup.categories.map((cat) => {
                const active = activeSubId === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`nav-pill${active ? " nav-pill-active" : ""}`}
                    onClick={() => onSelectSub(cat.id)}
                    whileTap={{ scale: 0.97 }}
                  >
                    {cat.label}
                    <span className="nav-pill-count">{cat.products.length}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
