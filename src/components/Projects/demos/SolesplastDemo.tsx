import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Plus, X, Search } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  status: 'active' | 'inactive';
}

const INITIAL: Client[] = [
  { id: 1, name: 'Carlos Mendoza', company: 'Plásticos del Sur', email: 'carlos@plasticos.com', status: 'active' },
  { id: 2, name: 'Ana García', company: 'Packaging Pro', email: 'ana@packaging.com', status: 'active' },
  { id: 3, name: 'Roberto Silva', company: 'Industrias Silva', email: 'rob@silva.com', status: 'inactive' },
  { id: 4, name: 'María López', company: 'MegaPlast', email: 'maria@megaplast.com', status: 'active' },
  { id: 5, name: 'Juan Torres', company: 'Envases JT', email: 'juan@envases.com', status: 'inactive' },
];

export function SolesplastDemo() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>(INITIAL);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Client | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', status: 'active' as 'active' | 'inactive' });

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => setClients((prev) => prev.filter((c) => c.id !== id));

  const handleSave = () => {
    if (editing) {
      setClients((prev) => prev.map((c) => (c.id === editing.id ? { ...editing, ...form } : c)));
      setEditing(null);
    } else {
      setClients((prev) => [...prev, { ...form, id: Date.now() }]);
      setAdding(false);
    }
    setForm({ name: '', company: '', email: '', status: 'active' });
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, company: c.company, email: c.email, status: c.status });
  };

  const modalOpen = adding || !!editing;

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', minHeight: 420 }}>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            placeholder={t('demo.solesplast.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setAdding(true); setForm({ name: '', company: '', email: '', status: 'active' }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={14} />
          {t('demo.solesplast.add')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t('demo.solesplast.name'), t('demo.solesplast.company'), 'Email', t('demo.solesplast.status'), ''].map((h) => (
                <th key={h} className="text-left pb-3 px-2 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }} className="group">
                <td className="py-3 px-2 font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td className="py-3 px-2" style={{ color: 'var(--text-secondary)' }}>{c.company}</td>
                <td className="py-3 px-2" style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: c.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: c.status === 'active' ? '#22c55e' : '#ef4444',
                    }}>
                    {c.status === 'active' ? t('demo.solesplast.active') : t('demo.solesplast.inactive')}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--accent)' }}><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: '#ef4444' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {editing ? t('demo.solesplast.edit') : t('demo.solesplast.add_title')}
              </h3>
              <button onClick={() => { setAdding(false); setEditing(null); }} style={{ color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {(['name', 'company', 'email'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{t(`demo.solesplast.${field}`)}</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    value={form[field]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{t('demo.solesplast.status')}</label>
                <select
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
                >
                  <option value="active">{t('demo.solesplast.active')}</option>
                  <option value="inactive">{t('demo.solesplast.inactive')}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setAdding(false); setEditing(null); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{t('demo.solesplast.cancel')}</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>{t('demo.solesplast.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
