import { motion } from "framer-motion";

const TZ = "America/Argentina/Buenos_Aires";

function isWeekendInArgentina() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date());
  return weekday === "Sat" || weekday === "Sun";
}

const floaters = ["🥫", "🐾", "📦", "🚚"];

export default function WeekendDeliveryBanner() {
  if (!isWeekendInArgentina()) return null;

  return (
    <motion.section
      className="weekend-banner"
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      aria-live="polite"
    >
      <div className="weekend-banner-bg" aria-hidden>
        {floaters.map((emoji, i) => (
          <motion.span
            key={emoji}
            className="weekend-banner-float"
            style={{ left: `${8 + i * 22}%`, top: `${12 + (i % 2) * 40}%` }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, i % 2 ? 8 : -8, 0],
              opacity: [0.35, 0.7, 0.35],
            }}
            transition={{
              duration: 3.2 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.25,
            }}
          >
            {emoji}
          </motion.span>
        ))}
        <motion.div
          className="weekend-banner-shine"
          animate={{ x: ["-120%", "220%"] }}
          transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
        />
      </div>

      <div className="weekend-banner-inner">
        <motion.span
          className="weekend-banner-badge"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          ✨ Fin de semana
        </motion.span>

        <h2 className="weekend-banner-title">
          <span className="weekend-banner-emoji">🥫</span>
          Alimento balanceado
        </h2>

        <p className="weekend-banner-text">
          Los pedidos de <strong>alimento balanceado</strong> que hagas hoy se entregan
          en días hábiles:
        </p>

        <div className="weekend-banner-chips">
          <motion.span
            className="weekend-banner-chip weekend-banner-chip-days"
            whileHover={{ scale: 1.04 }}
          >
            <span className="weekend-banner-chip-icon">📅</span>
            Lunes a viernes
          </motion.span>
          <motion.span
            className="weekend-banner-chip weekend-banner-chip-hours"
            whileHover={{ scale: 1.04 }}
          >
            <span className="weekend-banner-chip-icon">🕗</span>
            8:00 a 20:00 hs
          </motion.span>
        </div>

        <p className="weekend-banner-foot">
          ¡Podés encargar tranquilo! Te coordinamos la entrega por WhatsApp 💬
        </p>
      </div>
    </motion.section>
  );
}
