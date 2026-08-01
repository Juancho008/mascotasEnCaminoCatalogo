import { motion } from "framer-motion";

const TZ = "America/Argentina/Buenos_Aires";

function isWeekendInArgentina() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date());
  return weekday === "Sat" || weekday === "Sun";
}

export default function WeekendDeliveryBanner({ visible = true }) {
  if (!visible || !isWeekendInArgentina()) return null;

  return (
    <motion.aside
      className="weekend-banner"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-live="polite"
    >
      <div className="weekend-banner-inner">
        <span className="weekend-banner-badge">Fin de semana</span>
        <p className="weekend-banner-lead">
          Alimento: entrega <strong>lun–vie · 8–20 hs</strong>
        </p>
      </div>
    </motion.aside>
  );
}
