import { motion } from "framer-motion";

const floating = ["🐶", "🐱", "🦴", "🐾", "❤️"];

export default function Hero({ site }) {
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden>
        {floating.map((emoji, i) => (
          <motion.span
            key={i}
            className="hero-float"
            style={{ left: `${10 + i * 18}%` }}
            animate={{ y: [0, -22, 0], rotate: [0, 8, -8, 0] }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.img
          className="hero-logo"
          src={site.logo}
          alt={site.storeName}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        />
        <h1 className="hero-title">{site.storeName}</h1>
        {site.tagline && <p className="hero-tagline">{site.tagline}</p>}
      </motion.div>
    </section>
  );
}
