import { useState } from "react";
import {
  emptyGroup,
  emptyProduct,
  emptySubcategory,
  slugify,
} from "../utils/catalogGroups.js";
import { uploadProductImage } from "../utils/uploadProductImage.js";

export default function CatalogEditor({
  editorState,
  onChange,
  onSave,
  loading,
  adminToken,
}) {
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadError, setUploadError] = useState("");

  if (!editorState) return null;

  const { site, groups } = editorState;

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
    if (patch.label) {
      next[gi].id = slugify(patch.label) || next[gi].id;
    }
    updateGroups(next);
  }

  function updateSubcategory(gi, si, patch) {
    const next = groups.map((g, i) => {
      if (i !== gi) return g;
      const subs = g.subcategories.map((s, j) => {
        if (j !== si) return s;
        const updated = { ...s, ...patch };
        if (patch.label) updated.id = slugify(patch.label) || s.id;
        return updated;
      });
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

  return (
    <div className="catalog-editor">
      <section className="admin-card admin-site-card">
        <h2>Datos de la tienda</h2>
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
      </section>

      {groups.map((group, gi) => {
        const groupVisible = group.subcategories.some((s) => s.enabled !== false);
        return (
        <section
          key={group.id}
          className={`admin-card admin-group-card${groupVisible ? "" : " admin-group-card-off"}`}
        >
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
              {groupVisible ? "👁 Visible en tienda" : "🚫 Oculta en tienda"}
            </button>
            <button
              type="button"
              className="admin-btn-danger"
              onClick={() => removeGroup(gi)}
            >
              Eliminar categoría
            </button>
          </div>

          {group.subcategories.map((sub, si) => {
            const subVisible = sub.enabled !== false;
            return (
            <div
              key={sub.id}
              className={`admin-subcategory${subVisible ? "" : " admin-subcategory-off"}`}
            >
              <div className="admin-subcategory-head">
                <label>
                  Subcategoría
                  <input
                    value={sub.label}
                    onChange={(e) =>
                      updateSubcategory(gi, si, { label: e.target.value })
                    }
                    placeholder="Ej: ESTAMPA, Collares, Vagoneta"
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
                  className={`admin-btn-toggle admin-btn-toggle-sm${subVisible ? "" : " admin-btn-toggle-off"}`}
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
                    Quitar subcategoría
                  </button>
                )}
              </div>

              <div className="admin-products">
                <div className="admin-products-head">
                  <span>Productos ({sub.products.length})</span>
                  <button type="button" onClick={() => addProduct(gi, si)}>
                    + Agregar producto
                  </button>
                </div>

                {sub.products.length === 0 ? (
                  <p className="admin-hint">Sin productos en esta subcategoría.</p>
                ) : (
                  <div className="admin-product-list">
                    {sub.products.map((product, pi) => {
                      const rowKey = `${gi}-${si}-${pi}`;
                      const isUploading = uploadingKey === rowKey;
                      return (
                      <div key={product.id || pi} className="admin-product-row">
                        <div className="admin-product-image">
                          <img
                            src={product.image || "/images/Logo/LogoMascotaEnCamino.png"}
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
                              updateProduct(gi, si, pi, { code: e.target.value })
                            }
                            placeholder="330"
                          />
                        </label>
                        <label className="admin-product-name">
                          Nombre
                          <input
                            value={product.name}
                            onChange={(e) =>
                              updateProduct(gi, si, pi, { name: e.target.value })
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
          );
          })}

          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => addSubcategory(gi)}
          >
            + Agregar subcategoría
          </button>
        </section>
      );
      })}

      <div className="admin-editor-actions">
        {uploadError && <p className="admin-error">{uploadError}</p>}
        <button type="button" className="admin-btn-secondary" onClick={addGroup}>
          + Agregar categoría principal
        </button>
        <button
          type="button"
          className="admin-import-btn"
          onClick={onSave}
          disabled={loading}
        >
          {loading ? "Guardando…" : "Guardar catálogo en Cloudflare"}
        </button>
      </div>
    </div>
  );
}
