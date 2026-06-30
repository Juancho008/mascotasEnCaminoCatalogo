import { motion } from "framer-motion";

const DEFAULT_LOGO = "/images/Logo/LogoMascotaEnCamino.png";
const floaters = ["🐾", "❤️", "🐶", "🐾", "🐱", "🦴"];

export default function Loader({
  logo = DEFAULT_LOGO,
  progress = null,
  storeName = "Mascotas en Camino",
}) {
  const hasProgress = typeof progress === "number";
  const pct = hasProgress ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <div className="loader-screen">
      <div className="loader-bg" aria-hidden>
        {floaters.map((emoji, i) => (
          <motion.span
            key={i}
            className="loader-float"
            style={{ left: `${8 + i * 16}%`, top: `${15 + (i % 3) * 26}%` }}
            animate={{ y: [0, -18, 0], opacity: [0.25, 0.6, 0.25] }}
            transition={{
              duration: 3 + i * 0.45,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <div className="loader-stage">
        <motion.div
          className="loader-ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
        <motion.div
          className="loader-pulse"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.img
          className="loader-logo"
          src={logo}
          alt={storeName}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.07, 1],
            opacity: 1,
            y: [0, -6, 0],
          }}
          transition={{
            scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.5 },
          }}
        />
      </div>

      <motion.h1
        className="loader-store-name"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {storeName}
      </motion.h1>

      <div className="loader-bar" role="progressbar" aria-valuenow={pct ?? undefined}>
        {hasProgress ? (
          <motion.div
            className="loader-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        ) : (
          <motion.div
            className="loader-bar-fill loader-bar-indeterminate"
            animate={{ x: ["-100%", "260%"] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <p className="loader-text">
        {hasProgress ? `Preparando el catálogo… ${pct}%` : "Cargando el catálogo…"}
      </p>
    </div>
  );
}
