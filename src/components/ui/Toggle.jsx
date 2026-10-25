import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Toggle({ enabled, isChecked, checked, onChange, onToggle }) {
  const active = Boolean(enabled ?? isChecked ?? checked ?? false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const isInitialMount = useRef(true);
  const prevActive = useRef(active);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prevActive.current !== active) {
      if (!isInitialMount.current) {
        setHasInteracted(true);
      }
      prevActive.current = active;
    }
  }, [active]);

  const handleClick = (e) => {
    e.stopPropagation();
    setHasInteracted(true);
    if (onChange) {
      onChange(!active, e);
    } else if (onToggle) {
      onToggle(!active, e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle setting"
      aria-checked={active}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border px-0.5 focus:outline-none ${
        hasInteracted
          ? "transition-colors duration-300 ease-in-out"
          : "transition-none"
      } ${
        active
          ? "bg-emerald-500 shadow-md shadow-emerald-500/30 border-emerald-400/50"
          : "bg-[#0b0c16] border-zinc-700/80 hover:border-zinc-600"
      }`}
    >
      <motion.span
        initial={false}
        animate={{
          x: active ? 20 : 0,
        }}
        transition={
          hasInteracted
            ? {
                type: "spring",
                stiffness: 500,
                damping: 30,
              }
            : { duration: 0 }
        }
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0"
      />
    </button>
  );
}