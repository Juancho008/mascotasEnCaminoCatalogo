import { useEffect, useState } from "react";

const STORAGE_KEY = "mec_admin_token";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export default function AdminPanel() {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("pdf");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [catalogJson, setCatalogJson] = useState("");

  useEffect(() => {
    if (!token) return;
    loadDocuments();
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
    setCatalogJson("");
    setDocuments([]);
  }

  async function loadCatalog() {
    const r = await fetch("/api/admin/catalog", { headers: authHeaders(token) });
    const text = await r.text();
    if (!r.ok) throw new Error("No se pudo cargar el catálogo");
    const data = JSON.parse(text);
    setCatalogJson(JSON.stringify(data, null, 2));
    setDocuments(data.documents || []);
  }

  async function loadDocuments() {
    try {
      const r = await fetch("/api/documents");
      if (r.ok) setDocuments(await r.json());
    } catch {
      /* ignorar */
    }
  }

  async function uploadPdf(e) {
    e.preventDefault();
    if (!pdfFile) {
      setError("Seleccioná un PDF");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", pdfFile);
      form.append("title", pdfTitle || pdfFile.name);
      const r = await fetch("/api/admin/documents", {
        method: "POST",
        headers: authHeaders(token),
        body: form,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Error al subir");
      setMessage("PDF subido correctamente");
      setPdfFile(null);
      setPdfTitle("");
      e.target.reset();
      await loadDocuments();
      await loadCatalog();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePdf(id) {
    if (!confirm("¿Eliminar este PDF?")) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "No se pudo eliminar");
      setMessage("PDF eliminado");
      await loadDocuments();
      await loadCatalog();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveCatalog(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const parsed = JSON.parse(catalogJson);
      const r = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "No se pudo guardar");
      setMessage("Catálogo guardado en Cloudflare");
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
          <p>Subí PDFs y editá el catálogo en Cloudflare.</p>
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
      <div className="admin-layout">
        <header className="admin-header">
          <div>
            <h1>Panel de administración</h1>
            <p>Gestioná catálogos PDF y datos en Cloudflare KV</p>
          </div>
          <div className="admin-header-actions">
            <a href="/">Ver tienda</a>
            <button type="button" className="admin-btn-ghost" onClick={logout}>
              Salir
            </button>
          </div>
        </header>

        <nav className="admin-tabs">
          <button
            type="button"
            className={tab === "pdf" ? "active" : ""}
            onClick={() => setTab("pdf")}
          >
            📄 Catálogos PDF
          </button>
          <button
            type="button"
            className={tab === "json" ? "active" : ""}
            onClick={() => setTab("json")}
          >
            📦 Editar catálogo (JSON)
          </button>
        </nav>

        {message && <p className="admin-success">{message}</p>}
        {error && <p className="admin-error">{error}</p>}

        {tab === "pdf" && (
          <section className="admin-card">
            <h2>Subir catálogo en PDF</h2>
            <p className="admin-hint">
              El PDF queda guardado en Cloudflare y tus clientes pueden descargarlo desde la tienda.
              Para agregar productos con precios, usá la pestaña JSON o editá <code>config/products.json</code> y corré <code>npm run kv:sync</code>.
            </p>
            <form onSubmit={uploadPdf} className="admin-form">
              <label>
                Título visible
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="Ej: Catálogo otoño 2026"
                />
              </label>
              <label>
                Archivo PDF (máx. 10 MB)
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Subiendo…" : "Subir PDF"}
              </button>
            </form>

            <h3>PDFs publicados</h3>
            {documents.length === 0 ? (
              <p className="admin-hint">Todavía no hay PDFs.</p>
            ) : (
              <ul className="admin-doc-list">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <div>
                      <strong>{doc.title}</strong>
                      <span>{doc.filename}</span>
                    </div>
                    <div className="admin-doc-actions">
                      <a href={`/api/documents?id=${doc.id}`} target="_blank" rel="noreferrer">
                        Ver
                      </a>
                      <button type="button" onClick={() => deletePdf(doc.id)}>
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "json" && (
          <section className="admin-card">
            <h2>Editar catálogo completo</h2>
            <p className="admin-hint">
              Modificá productos, precios, WhatsApp y más. Al guardar se actualiza Cloudflare KV al instante.
            </p>
            <form onSubmit={saveCatalog} className="admin-form">
              <label>
                JSON del catálogo
                <textarea
                  value={catalogJson}
                  onChange={(e) => setCatalogJson(e.target.value)}
                  rows={22}
                  spellCheck={false}
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Guardando…" : "Guardar en Cloudflare"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
