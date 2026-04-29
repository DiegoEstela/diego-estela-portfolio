import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eraser, FileSignature, CheckCircle2 } from 'lucide-react';

export function SignatureDemo() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [signed, setSigned] = useState(false);
  const [sigDataUrl, setSigDataUrl] = useState('');
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#4A9FD9';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setDrawing(true);
    setSigned(false);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
  };

  const stopDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    setSigned(false);
    setSigDataUrl('');
  };

  const sign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSig) return;
    setSigDataUrl(canvas.toDataURL());
    setSigned(true);
  };

  return (
    <div className="p-4" style={{ minHeight: 420 }}>
      {!signed ? (
        <div className="max-w-lg mx-auto space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="px-4 py-2 text-xs font-semibold" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
              {t('demo.signature.draw')}
            </div>
            <canvas
              ref={canvasRef}
              width={500}
              height={160}
              className="w-full block cursor-crosshair touch-none"
              style={{ background: 'rgba(74,159,217,0.03)' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={clear}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Eraser size={14} />
              {t('demo.signature.clear')}
            </button>
            <button
              onClick={sign}
              disabled={!hasSig}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              <FileSignature size={14} />
              {t('demo.signature.sign')}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{ background: '#fff', color: '#1E293B', border: '1px solid #E2E8F0' }}
          >
            <div className="bg-[#1D4E68] text-white px-6 py-4 text-center">
              <h3 className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t('demo.signature.contract_title')}
              </h3>
              <p className="text-white/70 text-xs mt-0.5">Nº 2026/001-DE</p>
            </div>

            <div className="px-6 py-5 space-y-3 text-xs leading-relaxed text-slate-600">
              <p>En Madrid, a 27 de Abril de 2026, reunidas las partes en el presente contrato de prestación de servicios profesionales, convienen en celebrar el siguiente acuerdo con arreglo a las siguientes cláusulas:</p>
              <p><strong className="text-slate-800">PRIMERA.</strong> El prestador se compromete a desarrollar los servicios de ingeniería de software acordados según las especificaciones técnicas adjuntas al presente documento.</p>
              <p><strong className="text-slate-800">SEGUNDA.</strong> La duración del presente contrato será de seis (6) meses, renovable por acuerdo de ambas partes con un preaviso mínimo de treinta días naturales.</p>
            </div>

            <div className="px-6 pb-5 border-t border-slate-100 pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-2">{t('demo.signature.signature_label')}</p>
                  <div className="border-b border-slate-300 pb-1" style={{ width: 200 }}>
                    <img src={sigDataUrl} alt="signature" className="h-12 object-contain" style={{ maxWidth: 200 }} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-600">{t('demo.signature.signed')}</p>
                  <p className="text-xs text-slate-400">27/04/2026</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={clear}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            {t('demo.signature.clear')}
          </button>
        </div>
      )}
    </div>
  );
}
