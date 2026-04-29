import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, Clock, Dumbbell, Calendar, Terminal, ExternalLink } from 'lucide-react';

type Step = { label: string; detail: string; icon: React.ReactNode; duration: number };

const STEPS: Step[] = [
  { label: 'Iniciando navegador',     detail: 'selenium.webdriver.Chrome(options)',  icon: <Terminal size={14} />,  duration: 600  },
  { label: 'Abriendo portal del gym', detail: 'driver.get("https://gym-portal.es")', icon: <Terminal size={14} />,  duration: 900  },
  { label: 'Login automático',        detail: 'Credenciales desde .env',             icon: <Terminal size={14} />,  duration: 700  },
  { label: 'Navegando a "Reservas"',  detail: 'click → Clases · Reservar',           icon: <Calendar size={14} />,  duration: 800  },
  { label: 'Buscando clase: Crossfit',detail: 'Filtro: Lunes 07:30',                 icon: <Dumbbell size={14} />,  duration: 700  },
  { label: 'Reserva confirmada ✓',    detail: 'Clase reservada exitosamente',        icon: <CheckCircle2 size={14}/>, duration: 500 },
];

const CLASSES = [
  { name: 'Crossfit',    time: 'Lun 07:30', reserved: true,  spots: 2  },
  { name: 'Yoga Flow',   time: 'Mar 09:00', reserved: false, spots: 8  },
  { name: 'HIIT',        time: 'Mié 07:30', reserved: true,  spots: 0  },
  { name: 'Spinning',    time: 'Jue 18:30', reserved: false, spots: 5  },
  { name: 'Pilates',     time: 'Vie 08:00', reserved: false, spots: 12 },
];

export function GymBotDemo() {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const runBot = () => {
    if (running) return;
    setRunning(true);
    setCompleted([]);
    setDone(false);

    let delay = 0;
    STEPS.forEach((step, i) => {
      delay += step.duration;
      setTimeout(() => {
        setCompleted((prev) => [...prev, i]);
        if (i === STEPS.length - 1) {
          setRunning(false);
          setDone(true);
        }
      }, delay);
    });
  };

  const reset = () => { setRunning(false); setCompleted([]); setDone(false); };

  return (
    <div className="p-5" style={{ minHeight: 400 }}>
      <div className="grid md:grid-cols-2 gap-5">

        {/* Left: terminal simulation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal size={14} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                reserva_gym.py
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-80" />
            </div>
          </div>

          {/* Terminal window */}
          <div
            className="rounded-xl p-4 font-mono text-xs space-y-1.5 min-h-48"
            style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p style={{ color: '#8B949E' }}># 🤖 Gym Reservation Bot v1.0</p>
            <p style={{ color: '#8B949E' }}># Ejecutado: cron 0 6 * * 1,3,5</p>
            <div className="pt-1" />
            {STEPS.map((step, i) => (
              <AnimatePresence key={i}>
                {completed.includes(i) && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2"
                  >
                    <span style={{ color: '#3FB950' }}>✓</span>
                    <span style={{ color: '#E6EDF3' }}>{step.label}</span>
                    <span style={{ color: '#8B949E' }}>· {step.detail}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
            {running && !done && (
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <span style={{ color: '#F0883E' }}>▶</span>
                <span style={{ color: '#E6EDF3' }}>
                  {STEPS[completed.length]?.label ?? 'Procesando...'}
                </span>
                <span style={{ color: '#58A6FF' }}>_</span>
              </motion.div>
            )}
            {done && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1">
                <p style={{ color: '#3FB950' }}>✅ Proceso completado en {STEPS.reduce((a,s)=>a+s.duration,0)/1000}s</p>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={done ? reset : runBot}
              disabled={running}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: done ? '#22c55e' : 'var(--accent)' }}
            >
              {running
                ? <><Clock size={14} className="animate-spin" />Ejecutando...</>
                : done
                ? <><CheckCircle2 size={14} />Resetear</>
                : <><Play size={14} />Ejecutar bot</>
              }
            </button>
            <a
              href="https://github.com/DiegoEstela/reserva_gym"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <ExternalLink size={13} />
              GitHub
            </a>
          </div>
        </div>

        {/* Right: class schedule */}
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
            📅 Clases de la semana
          </p>
          <div className="space-y-2">
            {CLASSES.map((cls) => {
              const isNew = done && cls.name === 'Crossfit';
              return (
                <motion.div
                  key={cls.name}
                  animate={isNew ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${cls.reserved || isNew ? 'rgba(74,159,217,0.3)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: cls.reserved ? 'rgba(74,159,217,0.15)' : 'rgba(255,255,255,0.04)' }}
                    >
                      <Dumbbell size={14} style={{ color: cls.reserved ? 'var(--accent)' : 'var(--text-secondary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cls.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cls.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {cls.reserved ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(74,159,217,0.15)', color: 'var(--accent)' }}>
                        Reservado ✓
                      </span>
                    ) : cls.spots === 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        Completo
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cls.spots} plazas</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'rgba(74,159,217,0.06)', border: '1px solid rgba(74,159,217,0.12)' }}>
            <p className="font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>⚙️ Cómo funciona</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Cron job ejecuta el script a las 6:00 AM los L/M/V. Selenium abre el navegador en modo headless, hace login con las credenciales del <code>.env</code> y reserva la clase configurada automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
