import { useMemo, useState } from "react";
import {
  emptyGroup,
  emptyProduct,
  emptySubcategory,
} from "../utils/catalogGroups.js";
import { uploadProductImage } from "../utils/uploadProductImage.js";

function sectionId(gi, si) {
  if (gi === undefined) return "site";
  if (si === undefined) return `g-${gi}`;
  return `g-${gi}-s-${si}`;
}

export default function CatalogEditor({
  editorState,
  onChange,
  onSave,
  loading,
  adminToken,
}) {
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [activeNav, setActiveNav] = useState("site");
  const [expanded, setExpanded] = useState(() => new Set(["site"]));

  const { site, groups } = editorState || { site: {}, groups: [] };

  const navItems = useMemo(() => {
    const items = [{ id: "site", label: "Datos de tienda", emoji: "🏪", depth: 0 }];
    groups.forEach((group, gi) => {
      items.push({
        id: sectionId(gi),
        label: group.label,
        emoji: "📁",
        depth: 0,
        hidden: !group.subcategories.some((s) => s.enabled !== false),
      });
      group.subcategories.forEach((sub, si) => {
        items.push({
          id: sectionId(gi, si),
          label: sub.label,
          emoji: sub.emoji || "🐾",
          depth: 1,
          count: sub.products.length,
          hidden: sub.enabled === false,
        });
      });
    });
    return items;
  }, [groups]);

  const totalProducts = useMemo(
    () =>
      groups.reduce(
        (n, g) => n + g.subcategories.reduce((m, s) => m + s.products.length, 0),
        0
      ),
    [groups]
  );

  function updateSite(field, value) {
    onChange({
      ...editorState,
      site: { ...site, [field]: value },
    });
  }

  function updateGroups(nextGroups) {
    onChange({ ...editorState, groups: nextGroups });
  }

  function updateGroup(gi, patch) {
    const next = groups.map((g, i) => (i === gi ? { ...g, ...patch } : g));
    updateGroups(next);
  }

  function updateSubcategory(gi, si, patch) {
    const next = groups.map((g, i) => {
      if (i !== gi) return g;
      const subs = g.subcategories.map((s, j) =>
        j === si ? { ...s, ...patch } : s
      );
      return { ...g, subcategories: subs };
    });
    updateGroups(next);
  }

  function updateProduct(gi, si, pi, patch) {
    const next = groups.map((g, i) => {
      if (i !== gi) return g;
      return {
        ...g,
        subcategories: g.subcategories.map((s, j) => {
          if (j !== si) return s;
          return {
            ...s,
            products: s.products.map((p, k) => (k === pi ? { ...p, ...patch } : p)),
          };
        }),
      };
    });
    updateGroups(next);
  }

  function removeProduct(gi, si, pi) {
    const next = groups.map((g, i) => {
      if (i !== gi) return g;
      return {
        ...g,
        subcategories: g.subcategories.map((s, j) => {
          if (j !== si) return s;
          return { ...s, products: s.products.filter((_, k) => k !== pi) };
        }),
      };
    });
    updateGroups(next);
  }

  function addProduct(gi, si) {
    const sub = groups[gi].subcategories[si];
    const id = sectionId(gi, si);
    setExpanded((prev) => new Set(prev).add(id).add(sectionId(gi)));
    updateSubcategory(gi, si, {
      products: [...sub.products, emptyProduct(sub.id)],
    });
  }

  function addSubcategory(gi) {
    const g = groups[gi];
    updateGroup(gi, {
      subcategories: [...g.subcategories, emptySubcategory(g.id)],
    });
  }

  function removeSubcategory(gi, si) {
    const g = groups[gi];
    if (g.subcategories.length <= 1) return;
    updateGroup(gi, {
      subcategories: g.subcategories.filter((_, j) => j !== si),
    });
  }

  function addGroup() {
    updateGroups([...groups, emptyGroup()]);
  }

  function removeGroup(gi) {
    if (!confirm("¿Eliminar esta categoría y todas sus subcategorías?")) return;
    updateGroups(groups.filter((_, i) => i !== gi));
  }

  async function handleImageUpload(gi, si, pi, file) {
    if (!file) return;
    const key = `${gi}-${si}-${pi}`;
    setUploadError("");
    setUploadingKey(key);
    try {
      const url = await uploadProductImage(file, adminToken);
      updateProduct(gi, si, pi, { image: url });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadingKey(null);
    }
  }

  function toggleSubcategoryEnabled(gi, si) {
    const sub = groups[gi].subcategories[si];
    updateSubcategory(gi, si, { enabled: sub.enabled === false });
  }

  function toggleGroupEnabled(gi) {
    const g = groups[gi];
    const allEnabled = g.subcategories.every((s) => s.enabled !== false);
    updateGroup(gi, {
      subcategories: g.subcategories.map((s) => ({
        ...s,
        enabled: !allEnabled,
      })),
    });
  }

  function isOpen(id) {
    return expanded.has(id);
  }

  function setOpen(id, open) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleOpen(id) {
    setOpen(id, !isOpen(id));
  }

  function goToSection(id) {
    setActiveNav(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(id);
      const groupMatch = id.match(/^g-(\d+)/);
      if (groupMatch) next.add(`g-${groupMatch[1]}`);
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById(`editor-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function expandAll() {
    const all = new Set(["site"]);
    groups.forEach((_, gi) => {
      all.add(sectionId(gi));
      groups[gi].subcategories.forEach((_, si) => all.add(sectionId(gi, si)));
    });
    setExpanded(all);
  }

  function collapseAll() {
    setExpanded(new Set(["site"]));
  }

  if (!editorState) return null;

  const saveButton = (
    <button
      type="button"
      className="admin-import-btn catalog-editor-save-btn"
      onClick={onSave}
      disabled={loading}
    >
      {loading ? "Guardando…" : "Guardar cambios"}
    </button>
  );

  return (
    <div className="catalog-editor">
      <header className="catalog-editor-toolbar">
        <div className="catalog-editor-toolbar-info">
          <strong>Editor de catálogo</strong>
          <span>
            {groups.length} categoría(s) · {totalProducts} producto(s)
          </span>
        </div>
        <div className="catalog-editor-toolbar-actions">
          <button type="button" className="admin-btn-ghost" onClick={expandAll}>
            Expandir todo
          </button>
          <button type="button" className="admin-btn-ghost" onClick={collapseAll}>
            Colapsar
          </button>
          <button type="button" className="admin-btn-secondary" onClick={addGroup}>
            + Categoría
          </button>
          {saveButton}
        </div>
      </header>

      <div className="catalog-editor-body">
        <nav className="catalog-editor-nav" aria-label="Secciones del catálogo">
          <p className="catalog-editor-nav-title">Ir a…</p>
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`catalog-editor-nav-btn depth-${item.depth}${
                    activeNav === item.id ? " active" : ""
                  }${item.hidden ? " is-hidden-cat" : ""}`}
                  onClick={() => goToSection(item.id)}
                >
                  <span className="catalog-editor-nav-emoji">{item.emoji}</span>
                  <span className="catalog-editor-nav-label">{item.label}</span>
                  {item.count != null && (
                    <span className="catalog-editor-nav-count">{item.count}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="catalog-editor-main">
          {uploadError && <p className="admin-error">{uploadError}</p>}

          <section
            id="editor-site"
            className={`admin-card admin-site-card catalog-editor-section${
              isOpen("site") ? " is-open" : ""
            }`}
          >
            <button
              type="button"
              className="catalog-editor-section-toggle"
              onClick={() => toggleOpen("site")}
              aria-expanded={isOpen("site")}
            >
              <span>🏪 Datos de la tienda</span>
              <span className="catalog-editor-chevron">{isOpen("site") ? "▼" : "▶"}</span>
            </button>
            {isOpen("site") && (
              <div className="catalog-editor-section-body">
                <div className="admin-form admin-form-grid">
                  <label>
                    Nombre de la tienda
                    <input
                      value={site.storeName || ""}
                      onChange={(e) => updateSite("storeName", e.target.value)}
                    />
                  </label>
                  <label>
                    WhatsApp (sin + ni espacios)
                    <input
                      value={site.whatsappNumber || ""}
                      onChange={(e) => updateSite("whatsappNumber", e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}
          </section>

          {groups.map((group, gi) => {
            const groupId = sectionId(gi);
            const groupVisible = group.subcategories.some((s) => s.enabled !== false);
            const groupOpen = isOpen(groupId);

            return (
              <section
                key={groupId}
                id={`editor-${groupId}`}
                className={`admin-card admin-group-card catalog-editor-section${
                  groupVisible ? "" : " admin-group-card-off"
                }${groupOpen ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="catalog-editor-section-toggle catalog-editor-section-toggle-group"
                  onClick={() => toggleOpen(groupId)}
                  aria-expanded={groupOpen}
                >
                  <span>
                    📁 {group.label}
                    <small>
                      {group.subcategories.length} subcategoría(s)
                    </small>
                  </span>
                  <span className="catalog-editor-chevron">{groupOpen ? "▼" : "▶"}</span>
                </button>

                {groupOpen && (
                  <div className="catalog-editor-section-body">
                    <div className="admin-group-head">
                      <label className="admin-group-label">
                        Categoría principal
                        <input
                          value={group.label}
                          onChange={(e) => updateGroup(gi, { label: e.target.value })}
                          placeholder="Ej: Alimento balanceado"
                        />
                      </label>
                      <button
                        type="button"
                        className={`admin-btn-toggle${groupVisible ? "" : " admin-btn-toggle-off"}`}
                        onClick={() => toggleGroupEnabled(gi)}
                      >
                        {groupVisible ? "👁 Visible" : "🚫 Oculta"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-danger"
                        onClick={() => removeGroup(gi)}
                      >
                        Eliminar
                      </button>
                    </div>

                    {group.subcategories.map((sub, si) => {
                      const subId = sectionId(gi, si);
                      const subVisible = sub.enabled !== false;
                      const subOpen = isOpen(subId);

                      return (
                        <div
                          key={subId}
                          id={`editor-${subId}`}
                          className={`admin-subcategory catalog-editor-sub${
                            subVisible ? "" : " admin-subcategory-off"
                          }${subOpen ? " is-open" : ""}`}
                        >
                          <button
                            type="button"
                            className="catalog-editor-sub-toggle"
                            onClick={() => toggleOpen(subId)}
                            aria-expanded={subOpen}
                          >
                            <span>
                              {sub.emoji || "🐾"} {sub.label}
                              <small>{sub.products.length} producto(s)</small>
                            </span>
                            <span className="catalog-editor-sub-meta">
                              {!subVisible && <span className="catalog-editor-badge">Oculta</span>}
                              <span className="catalog-editor-chevron">
                                {subOpen ? "▼" : "▶"}
                              </span>
                            </span>
                          </button>

                          {subOpen && (
                            <div className="catalog-editor-sub-body">
                              <div className="admin-subcategory-head">
                                <label>
                                  Subcategoría
                                  <input
                                    value={sub.label}
                                    onChange={(e) =>
                                      updateSubcategory(gi, si, { label: e.target.value })
                                    }
                                    placeholder="Ej: ESTAMPA, Collares"
                                  />
                                </label>
                                <label className="admin-emoji-field">
                                  Emoji
                                  <input
                                    value={sub.emoji || "🐾"}
                                    onChange={(e) =>
                                      updateSubcategory(gi, si, { emoji: e.target.value })
                                    }
                                    maxLength={4}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className={`admin-btn-toggle admin-btn-toggle-sm${
                                    subVisible ? "" : " admin-btn-toggle-off"
                                  }`}
                                  onClick={() => toggleSubcategoryEnabled(gi, si)}
                                >
                                  {subVisible ? "👁 Visible" : "🚫 Oculta"}
                                </button>
                                {group.subcategories.length > 1 && (
                                  <button
                                    type="button"
                                    className="admin-btn-ghost"
                                    onClick={() => removeSubcategory(gi, si)}
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>

                              <div className="admin-products">
                                <div className="admin-products-head">
                                  <span>Productos</span>
                                  <button type="button" onClick={() => addProduct(gi, si)}>
                                    + Agregar
                                  </button>
                                </div>

                                {sub.products.length === 0 ? (
                                  <p className="admin-hint">Sin productos.</p>
                                ) : (
                                  <div className="admin-product-list">
                                    {sub.products.map((product, pi) => {
                                      const rowKey = `${gi}-${si}-${pi}`;
                                      const isUploading = uploadingKey === rowKey;
                                      return (
                                        <div
                                          key={rowKey}
                                          className="admin-product-row"
                                        >
                                          <div className="admin-product-image">
                                            <img
                                              src={
                                                product.image ||
                                                "/images/Logo/LogoMascotaEnCamino.png"
                                              }
                                              alt=""
                                            />
                                            <label className="admin-image-upload">
                                              {isUploading ? "Subiendo…" : "📷 Foto"}
                                              <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                disabled={isUploading || loading}
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) handleImageUpload(gi, si, pi, file);
                                                  e.target.value = "";
                                                }}
                                              />
                                            </label>
                                          </div>
                                          <label>
                                            Código
                                            <input
                                              value={product.code || ""}
                                              onChange={(e) =>
                                                updateProduct(gi, si, pi, {
                                                  code: e.target.value,
                                                })
                                              }
                                              placeholder="330"
                                            />
                                          </label>
                                          <label className="admin-product-name">
                                            Nombre
                                            <input
                                              value={product.name}
                                              onChange={(e) =>
                                                updateProduct(gi, si, pi, {
                                                  name: e.target.value,
                                                })
                                              }
                                            />
                                          </label>
                                          <label>
                                            Precio
                                            <input
                                              type="number"
                                              min="0"
                                              step="1"
                                              value={product.price ?? 0}
                                              onChange={(e) =>
                                                updateProduct(gi, si, pi, {
                                                  price: Number(e.target.value) || 0,
                                                })
                                              }
                                            />
                                          </label>
                                          <label className="admin-product-check">
                                            <input
                                              type="checkbox"
                                              checked={product.available !== false}
                                              onChange={(e) =>
                                                updateProduct(gi, si, pi, {
                                                  available: e.target.checked,
                                                })
                                              }
                                            />
                                            Disponible
                                          </label>
                                          <button
                                            type="button"
                                            className="admin-btn-danger-sm"
                                            onClick={() => removeProduct(gi, si, pi)}
                                            aria-label="Eliminar producto"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => addSubcategory(gi)}
                    >
                      + Agregar subcategoría
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <footer className="catalog-editor-savebar">
        <span>{totalProducts} productos en el catálogo</span>
        {saveButton}
      </footer>
    </div>
  );
}
