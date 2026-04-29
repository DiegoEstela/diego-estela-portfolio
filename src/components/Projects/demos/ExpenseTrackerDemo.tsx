import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Plus } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

type Category = 'food' | 'transport' | 'entertainment' | 'services' | 'other';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: Category;
  date: string;
}

const COLORS: Record<Category, string> = {
  food: '#4A9FD9',
  transport: '#7EC8E3',
  entertainment: '#F59E0B',
  services: '#10B981',
  other: '#8B5CF6',
};

const INITIAL: Expense[] = [
  { id: 1, description: 'Supermercado', amount: 85.5, category: 'food', date: '2026-04-25' },
  { id: 2, description: 'Metro mensual', amount: 56, category: 'transport', date: '2026-04-24' },
  { id: 3, description: 'Netflix', amount: 17.99, category: 'entertainment', date: '2026-04-23' },
  { id: 4, description: 'Restaurante', amount: 45, category: 'food', date: '2026-04-22' },
  { id: 5, description: 'Luz y gas', amount: 120, category: 'services', date: '2026-04-20' },
  { id: 6, description: 'Uber', amount: 22.5, category: 'transport', date: '2026-04-19' },
  { id: 7, description: 'Cine', amount: 14, category: 'entertainment', date: '2026-04-18' },
  { id: 8, description: 'Varios', amount: 35, category: 'other', date: '2026-04-17' },
];

export function ExpenseTrackerDemo() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL);
  const [form, setForm] = useState({ description: '', amount: '', category: 'food' as Category, date: new Date().toISOString().split('T')[0] });
  const [showForm, setShowForm] = useState(false);

  const totalByCategory = expenses.reduce<Record<Category, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<Category, number>);

  const categories: Category[] = ['food', 'transport', 'entertainment', 'services', 'other'];

  const chartData = {
    labels: categories.map((c) => t(`demo.expense.categories.${c}`)),
    datasets: [{
      data: categories.map((c) => totalByCategory[c] || 0),
      backgroundColor: categories.map((c) => COLORS[c]),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!form.description || !form.amount) return;
    setExpenses((p) => [...p, { ...form, id: Date.now(), amount: parseFloat(form.amount) }]);
    setForm({ description: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  return (
    <div className="p-4 space-y-4" style={{ minHeight: 420 }}>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="rounded-xl p-4 mb-4 glass">
            <p className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>{t('demo.expense.total')}</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>€{total.toFixed(2)}</p>
          </div>

          <div className="flex justify-center">
            <div style={{ width: 220, height: 220 }}>
              <Doughnut
                data={chartData}
                options={{
                  cutout: '70%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'var(--text-secondary)',
                        font: { size: 11 },
                        padding: 12,
                        boxWidth: 10,
                        boxHeight: 10,
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` €${(ctx.raw as number).toFixed(2)}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('demo.expense.recent')}</p>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={12} />
              {t('demo.expense.add')}
            </button>
          </div>

          {showForm && (
            <div className="rounded-xl p-3 mb-3 space-y-2 glass" style={{ border: '1px solid var(--border)' }}>
              <input
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                placeholder={t('demo.expense.description')}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  placeholder={t('demo.expense.amount')}
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
                <select
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Category }))}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{t(`demo.expense.categories.${c}`)}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAdd} className="w-full py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>
                {t('demo.expense.add')}
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {expenses.slice().reverse().map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[e.category] }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{e.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t(`demo.expense.categories.${e.category}`)}</p>
                  </div>
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>€{e.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
