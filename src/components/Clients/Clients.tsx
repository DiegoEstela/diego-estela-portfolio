import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';

interface Client {
  name: string;
  abbr: string;
  sector: string;
  color: string;
}

const CLIENTS: Client[] = [
  {
    name: 'Uma Salud IA',
    abbr: 'UMA',
    sector: 'HealthTech · IA',
    color: '#4A9FD9',
  },
  {
    name: 'Mapfre Inversiones',
    abbr: 'MAPFRE',
    sector: 'Fintech · Seguros',
    color: '#E8344E',
  },
  {
    name: 'CIPDH',
    abbr: 'CIPDH',
    sector: 'Derechos Humanos',
    color: '#7EC8E3',
  },
  {
    name: 'Wigou Logística',
    abbr: 'WIG',
    sector: 'Logística · SaaS',
    color: '#F59E0B',
  },
];

function ClientCard({ client }: { client: Client }) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-4 px-6 py-4 rounded-2xl mx-3 glass glow-hover"
      style={{
        border: '1px solid var(--border)',
        minWidth: 220,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
        style={{
          background: `${client.color}18`,
          color: client.color,
          border: `1px solid ${client.color}30`,
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '0.05em',
        }}
      >
        {client.abbr}
      </div>
      <div>
        <p
          className="font-semibold text-sm leading-tight"
          style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {client.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {client.sector}
        </p>
      </div>
    </div>
  );
}

function InfiniteMarquee({ speed = 35 }: { speed?: number }) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const items = [...CLIENTS, ...CLIENTS, ...CLIENTS];

  useAnimationFrame((_, delta) => {
    const containerWidth = containerRef.current?.scrollWidth ?? 0;
    const singleSetWidth = containerWidth / 3;
    let current = x.get();
    current -= (speed * delta) / 1000;
    if (Math.abs(current) >= singleSetWidth) {
      current = 0;
    }
    x.set(current);
  });

  return (
    <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
      <motion.div
        ref={containerRef}
        className="flex"
        style={{ x }}
      >
        {items.map((client, i) => (
          <ClientCard key={`${client.abbr}-${i}`} client={client} />
        ))}
      </motion.div>
    </div>
  );
}

export function Clients() {
  const { t } = useTranslation();

  return (
    <section className="py-16 overflow-hidden" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="text-xs font-semibold tracking-widest uppercase block mb-2"
            style={{ color: 'var(--accent)' }}
          >
            {t('clients.title')}
          </span>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('clients.subtitle')}
          </p>
        </motion.div>
      </div>

      <InfiniteMarquee speed={40} />
    </section>
  );
}
