import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import clsx from "clsx";

const LINKS = ["home", "about", "experience", "projects", "contact"] as const;
const SECTION_IDS: Record<string, string> = {
  home: "hero",
  about: "about",
  experience: "experience",
  projects: "projects",
  contact: "contact",
};

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            const key = Object.keys(SECTION_IDS).find(
              (k) => SECTION_IDS[k] === id,
            );
            if (key) setActive(key);
          }
        });
      },
      { threshold: 0.3 },
    );
    Object.values(SECTION_IDS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (link: string) => {
    const id = SECTION_IDS[link];
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const toggleLang = () => {
    const next = i18n.language === "es" ? "en" : "es";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "backdrop-blur-md border-b border-white/5 py-3" : "py-5",
      )}
      style={{
        background: scrolled
          ? isDark
            ? "rgba(15,23,41,0.85)"
            : "rgba(244,247,250,0.85)"
          : "transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <button
          onClick={() => scrollTo("home")}
          className="font-display font-bold text-lg tracking-tight"
          style={{
            color: "var(--text-primary)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Die<span style={{ color: "var(--accent)" }}>zte</span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <button
              key={link}
              onClick={() => scrollTo(link)}
              className={clsx(
                "text-sm font-medium transition-colors duration-200 relative",
                active === link
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t(`nav.${link}`)}
              {active === link && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="text-xs font-semibold px-2.5 py-1 rounded-md border transition-all duration-200 hover:opacity-80"
            style={{
              borderColor: "var(--accent)",
              color: "var(--accent)",
            }}
          >
            {i18n.language === "es" ? "EN" : "ES"}
          </button>

          <button
            onClick={toggle}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 mt-2"
            style={{
              background: isDark
                ? "rgba(15,23,41,0.95)"
                : "rgba(244,247,250,0.95)",
            }}
          >
            <div className="flex flex-col px-4 py-4 gap-4">
              {LINKS.map((link) => (
                <button
                  key={link}
                  onClick={() => scrollTo(link)}
                  className="text-left text-sm font-medium py-2 transition-colors"
                  style={{
                    color:
                      active === link
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                  }}
                >
                  {t(`nav.${link}`)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
