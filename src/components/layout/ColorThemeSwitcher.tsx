"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  collapsed?: boolean;
}

export function ColorThemeSwitcher({ collapsed }: Props) {
  const [isPink, setIsPink] = useState(false);

  useEffect(() => {
    setIsPink(document.documentElement.classList.contains("theme-pink"));
  }, []);

  const toggle = () => {
    const next = !isPink;
    const html = document.documentElement;
    if (next) {
      html.classList.add("theme-pink");
      localStorage.setItem("color-theme", "pink");
    } else {
      html.classList.remove("theme-pink");
      localStorage.setItem("color-theme", "blue");
    }
    setIsPink(next);
  };

  return (
    <button
      onClick={toggle}
      title={isPink ? "Switch to Blue theme" : "Switch to Pink theme"}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 w-full"
    >
      {/* Color swatch */}
      <span
        className={cn(
          "w-[18px] h-[18px] rounded-full border-2 border-white/40 shrink-0 transition-colors duration-300",
          isPink ? "bg-pink-400" : "bg-blue-400",
        )}
      />

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.12 }}
            className="whitespace-nowrap"
          >
            {isPink ? "Blue Theme" : "Pink Theme"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
