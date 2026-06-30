import { useEffect, useState } from "react";
import CatalogEditor from "./components/CatalogEditor.jsx";
import { catalogToGroups, groupsToCatalog } from "./utils/catalogGroups.js";
import { sanitizeCatalog } from "./utils/sanitizeCatalog.js";
import { applyAdminNoIndex } from "./utils/seo.js";

const STORAGE_KEY = "mec_admin_token";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export default function AdminPanel() {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("import");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [documents, setDocuments] = useState([]);

  const [editorState, setEditorState] = useState(null);

  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  useEffect(() => {
    applyAdminNoIndex();
  }, []);

  useEffect(() => {
    if (!token) return;
    loadCatalog();
  }, [token]);

  async function login(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/admin/catalog", {
        headers: authHeaders(password),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo ingresar");
      }
      sessionStorage.setItem(STORAGE_KEY, password);
      setToken(password);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken("");
    setEditorState(null);
    setDocuments([]);
  }

  async function loadCatalog() {
    const r = await fetch("/api/admin/catalog", { headers: authHeaders(token) });
    const text = await r.text();
    if (!r.ok) throw new Error("No se pudo cargar el catálogo");
    const data = JSON.parse(text);
    setEditorState(catalogToGroups(sanitizeCatalog(data)));
    setDocuments(data.documents || []);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function analyzeImportPdf(e) {
    e.preventDefault();
    if (!importFile) {
      setError("Seleccioná el PDF de precios");
      return;
    }
    setError("");
    setMessage("");
    setImportPreview(null);
    setLoading(true);
    try {
      const data = await fileToBase64(importFile);
      const r = await fetch("/api/admin/import-pdf", {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, action: "preview" }),
      });
      const resData = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resData.error || "No se pudo leer el PDF");
      setImportPreview(resData);
      setMessage(
        `Detectados ${resData.totalProducts} productos en ${resData.categories?.length || 0} categorías`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmImportPdf() {
    if (!importFile) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await fileToBase64(importFile);
      const r = await fetch("/api/admin/import-pdf", {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, action: "import", replace: true }),
      });
      const resData = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resData.error || "No se pudo importar");
      const n = resData.imported?.totalProducts || importPreview?.totalProducts;
      setMessage(
        n
          ? `Importados ${n} productos en Cloudflare. ¡Revisá la tienda!`
          : "Catálogo importado en Cloudflare"
      );
      setImportPreview(null);
      setImportFile(null);
      await loadCatalog();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveCatalog() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const payload = groupsToCatalog({ ...editorState, documents });
      const r = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "No se pudo guardar");
      setMessage("Catálogo guardado en Cloudflare. Abrí la tienda en una pestaña nueva para ver los cambios.");
      await loadCatalog();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="admin-screen">
        <form className="admin-card" onSubmit={login}>
          <h1>🐾 Panel de administración</h1>
          <p>Importá listas de precios y editá el catálogo en Cloudflare.</p>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña de admin"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
          <a className="admin-back" href="/">← Volver al catálogo</a>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-screen">
      <div className={`admin-layout${tab === "catalog" ? " admin-layout-wide" : ""}`}>
        <header className="admin-header">
          <div>
            <h1>Panel de administración</h1>
            <p>Importá productos desde PDF y editá el catálogo</p>
          </div>
          <div className="admin-header-actions">
            <a href="/" target="_blank" rel="noreferrer">
              Ver tienda
            </a>
            <button type="button" className="admin-btn-ghost" onClick={logout}>
              Salir
            </button>
          </div>
        </header>

        <nav className="admin-tabs">
          <button
            type="button"
            className={tab === "import" ? "active" : ""}
            onClick={() => setTab("import")}
          >
            📥 Importar lista PDF
          </button>
          <button
            type="button"
            className={tab === "catalog" ? "active" : ""}
            onClick={() => setTab("catalog")}
          >
            ✏️ Editar catálogo
          </button>
        </nav>

        {message && <p className="admin-success">{message}</p>}
        {error && <p className="admin-error">{error}</p>}

        {tab === "import" && (
          <section className="admin-card">
            <h2>Importar productos desde lista de precios (PDF)</h2>
            <p className="admin-hint">
              Subí una lista de precios en PDF: detectamos código, descripción y precio,
              y creamos la categoría <strong>Alimento balanceado</strong> con subcategorías (ESTAMPA, VAGONETA, etc.).
            </p>
            <form onSubmit={analyzeImportPdf} className="admin-form">
              <label>
                PDF de lista de precios (máx. 10 MB)
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setImportPreview(null);
                  }}
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Analizando…" : "Analizar PDF"}
              </button>
            </form>

            {importPreview && (
              <div className="admin-preview">
                <h3>Vista previa</h3>
                <ul className="admin-preview-list">
                  {importPreview.categories?.map((cat) => (
                    <li key={cat.id}>
                      <strong>{cat.label}</strong> — {cat.productCount} producto(s)
                      {cat.products?.[0] && (
                        <span>
                          {" "}
                          ej: {cat.products[0].name} (${cat.products[0].price})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="admin-import-btn"
                  onClick={confirmImportPdf}
                  disabled={loading}
                >
                  {loading ? "Importando…" : "Importar al catálogo en Cloudflare"}
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "catalog" && editorState && (
          <CatalogEditor
            editorState={editorState}
            onChange={setEditorState}
            onSave={saveCatalog}
            loading={loading}
            adminToken={token}
          />
        )}
      </div>
    </div>
  );
}
