import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Mail, Phone, GitFork } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export function Contact() {
  const { t } = useTranslation();
  const [ref, visible] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="contact" className="section-padding">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span
            className="text-sm font-semibold tracking-widest uppercase mb-3 block"
            style={{ color: "var(--accent)" }}
          >
            {t("contact.title")}
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: "var(--text-primary)",
            }}
          >
            {t("contact.title")}
          </h2>
          <p
            className="text-lg mb-12"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("contact.subtitle")}
          </p>

          <div className="flex flex-col max-w-md space-y-6">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("contact.or_reach")}
            </p>
            {[
                {
                  icon: <Mail size={18} />,
                  label: "die.estela@gmail.com",
                  href: "mailto:die.estela@gmail.com",
                },
                {
                  icon: <Phone size={18} />,
                  label: "+34 614 469 926",
                  href: "tel:+34614469926",
                },
                {
                  icon: <GitFork size={18} />,
                  label: "github.com/diegoestela",
                  href: "https://github.com/diegoestela",
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl glass glow-hover"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <div
                    className="p-2.5 rounded-xl"
                    style={{
                      background: "rgba(74,159,217,0.1)",
                      color: "var(--accent)",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.label}
                  </span>
                </a>
              ))}
          </div>
        </motion.div>

        <div
          className="mt-16 pt-8 text-center text-xs border-t"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          © 2026 Diezte · Built with React + TypeScript
        </div>
      </div>
    </section>
  );
}
