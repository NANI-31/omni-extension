import { motion } from "framer-motion";

export default function GlassButton({ children, onClick, danger = false }) {
  return (
    <motion.button
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.96,
      }}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
        danger
          ? "border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          : "border-white/10 bg-white/5 text-zinc-300 hover:border-violet-500/40 hover:bg-violet-500/10"
      }`}
    >
      {children}
    </motion.button>
  );
}