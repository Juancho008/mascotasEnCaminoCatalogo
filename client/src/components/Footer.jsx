export default function Footer({ site }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img className="footer-logo" src={site.logo} alt={site.storeName} />
        <p className="footer-name">{site.storeName}</p>
        {site.tagline && <p className="footer-tagline">{site.tagline}</p>}
        <p className="footer-copy">
          © {year} {site.storeName} · Hecho con 💙 para las mascotas
        </p>
      </div>
    </footer>
  );
}
