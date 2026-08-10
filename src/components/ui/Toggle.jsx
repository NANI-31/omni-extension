import React from "react";
import { motion } from "framer-motion";

export default function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      aria-label="Toggle module"
      aria-checked={enabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
        enabled
          ? "bg-emerald-500 shadow-md shadow-emerald-500/25"
          : "bg-zinc-800 border-zinc-700"
      }`}
    >
      <motion.span
        animate={{
          x: enabled ? 20 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0"
      />
    </button>
  );
}