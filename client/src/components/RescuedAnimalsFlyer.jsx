import { motion } from "framer-motion";
import { useMediaQuery } from "../hooks/useMediaQuery.js";

const RESCUED_URL = "https://animales-rescatados.vercel.app/";
const RESCUED_IMAGE = "/images/rescued/street-puppy.jpg";

export default function RescuedAnimalsFlyer() {
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <motion.a
      href={RESCUED_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`rescued-flyer${isMobile ? " rescued-flyer-mobile" : ""}`}
      aria-label="Conocé Huellas con Historia — animales rescatados"
      initial={
        isMobile
          ? { opacity: 0, y: 16 }
          : { x: "-120%", opacity: 0, rotate: -14 }
      }
      animate={
        isMobile ? { opacity: 1, y: 0 } : { x: 0, opacity: 1, rotate: -12 }
      }
      transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.35 }}
      whileHover={isMobile ? undefined : { scale: 1.04, rotate: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="rescued-flyer-body">
        <div className="rescued-flyer-photo-wrap">
          <img
            className="rescued-flyer-photo"
            src={RESCUED_IMAGE}
            alt="Cachorro en situación de calle esperando ayuda"
            loading="lazy"
          />
          <div className="rescued-flyer-photo-overlay" aria-hidden />
          <span className="rescued-flyer-badge rescued-flyer-badge-photo">
            💛 Necesitan ayuda
          </span>
        </div>

        {!isMobile && (
          <motion.div
            className="rescued-flyer-shine"
            animate={{ x: ["-130%", "220%"] }}
            transition={{
              duration: 4.2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
            aria-hidden
          />
        )}

        <div className="rescued-flyer-content">
          <p className="rescued-flyer-kicker">Huellas con Historia</p>
          <h2 className="rescued-flyer-title">Animales rescatados</h2>
          <p className="rescued-flyer-text">
            Cada historia merece una segunda oportunidad.
          </p>

          <span className="rescued-flyer-cta">
            Conocer historias
            <span className="rescued-flyer-arrow" aria-hidden>
              →
            </span>
          </span>
        </div>
      </div>
    </motion.a>
  );
}
