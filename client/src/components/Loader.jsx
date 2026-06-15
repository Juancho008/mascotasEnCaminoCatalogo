import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div className="state-screen">
      <motion.div
        className="loader-paw"
        animate={{ scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        🐾
      </motion.div>
      <p className="loader-text">Cargando el catálogo...</p>
    </div>
  );
}
