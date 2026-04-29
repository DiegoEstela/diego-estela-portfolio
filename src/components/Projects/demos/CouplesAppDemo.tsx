import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, Plus, Trophy } from 'lucide-react';

interface Task {
  id: number;
  text: string;
  completedBy: 'p1' | 'p2' | null;
  points: number;
}

const INITIAL_TASKS: Task[] = [
  { id: 1, text: 'Lavar los platos', completedBy: 'p1', points: 10 },
  { id: 2, text: 'Hacer la compra', completedBy: 'p2', points: 15 },
  { id: 3, text: 'Limpiar el baño', completedBy: null, points: 20 },
  { id: 4, text: 'Planchar la ropa', completedBy: 'p1', points: 10 },
  { id: 5, text: 'Sacar al perro', completedBy: null, points: 10 },
  { id: 6, text: 'Cocinar la cena', completedBy: 'p2', points: 15 },
];

export function CouplesAppDemo() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState('');

  const score = (player: 'p1' | 'p2') =>
    tasks.filter((t) => t.completedBy === player).reduce((s, t) => s + t.points, 0);

  const toggle = (id: number, player: 'p1' | 'p2') => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completedBy: t.completedBy === player ? null : player } : t
      )
    );
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((p) => [...p, { id: Date.now(), text: newTask, completedBy: null, points: 10 }]);
    setNewTask('');
  };

  const p1Score = score('p1');
  const p2Score = score('p2');
  const leader = p1Score > p2Score ? 'p1' : p2Score > p1Score ? 'p2' : null;

  return (
    <div className="p-4" style={{ minHeight: 420 }}>
      <div className="max-w-sm mx-auto">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl mx-auto"
          style={{
            border: '8px solid var(--bg-card)',
            background: 'var(--bg-primary)',
            maxWidth: 340,
            outline: '2px solid var(--border)',
          }}
        >
          <div
            className="px-5 pt-6 pb-4 text-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7EC8E3)' }}
          >
            <h3 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              💑 Matrimillas
            </h3>
            <p className="text-white/80 text-xs mt-0.5">{t('demo.couples.tasks')}</p>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['p1', 'p2'] as const).map((p) => {
                const pts = score(p);
                return (
                  <div
                    key={p}
                    className="rounded-xl p-3 text-center relative"
                    style={{
                      background: 'var(--bg-card)',
                      border: leader === p ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    {leader === p && (
                      <Trophy size={12} className="absolute top-2 right-2" style={{ color: '#F59E0B' }} />
                    )}
                    <div className="text-2xl mb-1">{p === 'p1' ? '👨‍💻' : '👩'}</div>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {t(`demo.couples.${p}`)}
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {pts}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('demo.couples.points')}</div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 mb-3 max-h-44 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <button onClick={() => toggle(task.id, 'p1')} style={{ color: task.completedBy === 'p1' ? 'var(--accent)' : 'var(--border)' }}>
                    {task.completedBy === 'p1' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <span
                    className="flex-1 text-xs"
                    style={{
                      color: task.completedBy ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: task.completedBy ? 'line-through' : 'none',
                    }}
                  >
                    {task.text}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>+{task.points}</span>
                  <button onClick={() => toggle(task.id, 'p2')} style={{ color: task.completedBy === 'p2' ? '#F59E0B' : 'var(--border)' }}>
                    {task.completedBy === 'p2' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                placeholder={t('demo.couples.task_placeholder')}
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <button
                onClick={addTask}
                className="p-2 rounded-lg text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
