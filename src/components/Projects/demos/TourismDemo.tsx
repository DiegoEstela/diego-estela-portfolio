import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Star, MapPin } from 'lucide-react';

interface Destination {
  name: string;
  country: string;
  description: string;
  rating: number;
  emoji: string;
  tags: string[];
}

const DESTINATIONS: Record<string, Destination[]> = {
  playa: [
    { name: 'Ibiza', country: 'España', description: 'Paraíso mediterráneo con playas cristalinas y vida nocturna legendaria.', rating: 4.8, emoji: '🏖️', tags: ['Playa', 'Fiesta', 'Sol'] },
    { name: 'Tenerife', country: 'España', description: 'La isla de las contrastes: playas negras, bosques y el Teide nevado.', rating: 4.7, emoji: '🌋', tags: ['Naturaleza', 'Playa', 'Senderismo'] },
    { name: 'Cancún', country: 'México', description: 'Aguas turquesas del Caribe con resorts de lujo y cenotes mágicos.', rating: 4.9, emoji: '🌊', tags: ['Playa', 'Lujo', 'Snorkel'] },
  ],
  montaña: [
    { name: 'Bariloche', country: 'Argentina', description: 'La Suiza argentina: lagos azules, picos nevados y chocolate artesanal.', rating: 4.9, emoji: '⛷️', tags: ['Ski', 'Naturaleza', 'Lagos'] },
    { name: 'Pirineos', country: 'España/Francia', description: 'Espectacular cadena montañosa con pueblos medievales y rutas épicas.', rating: 4.7, emoji: '🏔️', tags: ['Trekking', 'Ski', 'Cultura'] },
    { name: 'Patagonia', country: 'Argentina', description: 'El fin del mundo: glaciares, cóndores y paisajes que cortan el aliento.', rating: 5.0, emoji: '🦅', tags: ['Aventura', 'Glaciares', 'Wildlife'] },
  ],
  ciudad: [
    { name: 'Buenos Aires', country: 'Argentina', description: 'La París de Sudamérica: tango, arquitectura europea y gastronomía world-class.', rating: 4.8, emoji: '💃', tags: ['Cultura', 'Gastronomía', 'Tango'] },
    { name: 'Barcelona', country: 'España', description: 'Modernismo gaudiano, playa urbana y la mejor escena culinaria de Europa.', rating: 4.9, emoji: '🏛️', tags: ['Arte', 'Playa', 'Gastronomía'] },
    { name: 'Lisboa', country: 'Portugal', description: 'La ciudad de los siete colinas, fado melancólico y pastéis de nata irresistibles.', rating: 4.8, emoji: '🚋', tags: ['Historia', 'Fado', 'Gastronomía'] },
  ],
};

function getDestinations(query: string): Destination[] {
  const q = query.toLowerCase();
  if (q.includes('playa') || q.includes('beach') || q.includes('mar') || q.includes('ibiza') || q.includes('canc') || q.includes('españa') || q.includes('spain')) {
    return DESTINATIONS.playa;
  }
  if (q.includes('montaña') || q.includes('mountain') || q.includes('ski') || q.includes('bariloche') || q.includes('patagonia') || q.includes('argentina')) {
    return DESTINATIONS.montaña;
  }
  if (q.includes('ciudad') || q.includes('city') || q.includes('buenos') || q.includes('barcelona') || q.includes('lisboa')) {
    return DESTINATIONS.ciudad;
  }
  return [...DESTINATIONS.playa.slice(0, 1), ...DESTINATIONS.montaña.slice(0, 1), ...DESTINATIONS.ciudad.slice(0, 1)];
}

export function TourismDemo() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    setTimeout(() => {
      setResults(getDestinations(query));
      setLoading(false);
      setSearched(true);
    }, 1000);
  };

  return (
    <div className="p-4" style={{ minHeight: 420 }}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
          {t('demo.tourism.title')}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('demo.tourism.subtitle')}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          placeholder={t('demo.tourism.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-opacity disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search size={14} />
          )}
          {t('demo.tourism.search')}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Buscando destinos...</p>
        </div>
      )}

      {searched && !loading && (
        <>
          <p className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('demo.tourism.results')}
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {results.map((d) => (
              <div key={d.name} className="rounded-xl p-4 glass glow-hover" style={{ border: '1px solid var(--border)' }}>
                <div className="text-3xl mb-2">{d.emoji}</div>
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>{d.name}</h4>
                  <div className="flex items-center gap-0.5 text-xs" style={{ color: '#F59E0B' }}>
                    <Star size={10} fill="currentColor" />
                    <span className="font-semibold">{d.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--accent)' }}>
                  <MapPin size={10} />
                  {d.country}
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{d.description}</p>
                <div className="flex flex-wrap gap-1">
                  {d.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,159,217,0.15)', color: 'var(--accent)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!searched && !loading && (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Prueba: "playas en España" o "montañas en Argentina"</p>
        </div>
      )}
    </div>
  );
}
