import { motion } from "framer-motion";

export default function DocumentsSection({ documents = [] }) {
  if (!documents.length) return null;

  return (
    <section className="documents-section">
      <motion.div
        className="documents-inner"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="documents-title">📄 Catálogos para descargar</h2>
        <p className="documents-desc">
          Descargá nuestros catálogos en PDF con todos los productos.
        </p>
        <ul className="documents-list">
          {documents.map((doc) => (
            <li key={doc.id}>
              <a
                className="documents-link"
                href={doc.url || `/api/documents?id=${doc.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="documents-link-icon">📥</span>
                <span>
                  <strong>{doc.title}</strong>
                  {doc.filename && <small>{doc.filename}</small>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
