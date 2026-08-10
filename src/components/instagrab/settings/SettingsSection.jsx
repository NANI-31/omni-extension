import React from "react";
import { motion } from "framer-motion";

const colors = {
  blue: {
    border: "border-sky-500/15",
    bg: "bg-sky-500/5",
    glow: "bg-sky-500/10",
    text: "text-sky-300",
  },
  pink: {
    border: "border-pink-500/15",
    bg: "bg-pink-500/5",
    glow: "bg-pink-500/10",
    text: "text-pink-300",
  },
  violet: {
    border: "border-violet-500/15",
    bg: "bg-violet-500/5",
    glow: "bg-violet-500/10",
    text: "text-violet-300",
  },
  amber: {
    border: "border-amber-500/15",
    bg: "bg-amber-500/5",
    glow: "bg-amber-500/10",
    text: "text-amber-300",
  },
  emerald: {
    border: "border-emerald-500/15",
    bg: "bg-emerald-500/5",
    glow: "bg-emerald-500/10",
    text: "text-emerald-300",
  },
};

export default function SettingsSection({
  icon,
  title,
  description,
  color = "violet",
  children,
}) {
  const theme = colors[color];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className={`group relative overflow-hidden rounded-3xl border ${theme.border} bg-linear-to-br from-zinc-900/90 via-zinc-900/70 to-black/70 shadow-xl backdrop-blur-xl`}
    >

      {/* Glow */}
      <div className={`absolute -right-16 -top-16 h-56 w-56 rounded-full ${theme.glow} blur-[110px] transition-opacity duration-500 group-hover:opacity-100 opacity-70`} />

      {/* Header */}
      <div className={`relative flex items-center justify-between border-b border-white/5 px-7 py-5`}>

        <div className="flex items-center gap-4">

          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.bg} text-2xl shadow-lg`}>
            {icon}
          </div>

          <div>

            <p className={`text-[11px] font-bold uppercase tracking-[0.28em] ${theme.text}`}>
              {title}
            </p>

            <h3 className="mt-1 text-xl font-bold text-white">
              {title}
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {description}
            </p>

          </div>

        </div>

        <div className={`hidden md:flex items-center rounded-full border ${theme.border} ${theme.bg} px-4 py-2 text-xs font-semibold ${theme.text}`}>
          Active
        </div>

      </div>

      {/* Body */}
      <div className="relative p-7">
        {children}
      </div>

    </motion.section>
  );
}