import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ExternalLink } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  answer: boolean;
  movie: string;
  emoji: string;
}

const QUESTIONS: Question[] = [
  { id: '1',  question: 'Simba es el hijo de Mufasa en El Rey León.',            answer: true,  movie: 'El Rey León',   emoji: '🦁' },
  { id: '2',  question: 'Ariel es una sirena que sueña con ser humana.',          answer: true,  movie: 'La Sirenita',   emoji: '🧜‍♀️' },
  { id: '3',  question: 'Jafar es el padre de Jasmine.',                          answer: false, movie: 'Aladdín',       emoji: '🧞' },
  { id: '4',  question: 'Mulan se disfraza de hombre para unirse al ejército.',   answer: true,  movie: 'Mulan',         emoji: '⚔️' },
  { id: '5',  question: 'Mirabel es la única Madrigal sin don mágico.',           answer: true,  movie: 'Encanto',       emoji: '🦋' },
  { id: '6',  question: 'Remy es una rata que sueña con ser chef.',               answer: true,  movie: 'Ratatouille',   emoji: '🐭' },
  { id: '7',  question: 'Rapunzel tiene un cabello mágico que brilla.',           answer: true,  movie: 'Enredados',     emoji: '💇‍♀️' },
  { id: '8',  question: 'Wall-E es un robot diseñado para explorar el espacio.',  answer: false, movie: 'Wall-E',        emoji: '🤖' },
  { id: '9',  question: 'Elsa y Anna son hermanas en Frozen.',                    answer: true,  movie: 'Frozen',        emoji: '❄️' },
  { id: '10', question: 'Woody es un vaquero que pertenece a Andy.',              answer: true,  movie: 'Toy Story',     emoji: '🤠' },
  { id: '11', question: 'Moana pertenece a la tribu de los Kakamora.',            answer: false, movie: 'Moana',         emoji: '🌊' },
  { id: '12', question: 'Buzz Lightyear es un ranger del espacio de juguete.',    answer: true,  movie: 'Toy Story',     emoji: '🚀' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type State = 'playing' | 'correct' | 'wrong' | 'finished';

export function DisneyGameDemo() {
  const [questions] = useState(() => shuffle(QUESTIONS).slice(0, 8));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<State>('playing');
  const [wrongAnswer, setWrongAnswer] = useState(false);

  const q = questions[current];
  const progress = (current / questions.length) * 100;
  const isLast = current === questions.length - 1;

  const answer = useCallback((userAnswer: boolean) => {
    if (state !== 'playing') return;
    const correct = userAnswer === q.answer;
    if (correct) {
      setScore((s) => s + 1);
      setState('correct');
    } else {
      setWrongAnswer(true);
      setState('wrong');
    }
    setTimeout(() => {
      setWrongAnswer(false);
      if (isLast) {
        setState('finished');
      } else {
        setCurrent((c) => c + 1);
        setState('playing');
      }
    }, 1100);
  }, [state, q, isLast]);

  const restart = () => {
    setCurrent(0);
    setScore(0);
    setState('playing');
    setWrongAnswer(false);
  };

  const pct = Math.round((score / questions.length) * 100);
  const medal = pct === 100 ? '🏆' : pct >= 75 ? '🥇' : pct >= 50 ? '🥈' : '🥉';

  if (state === 'finished') {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center" style={{ minHeight: 380 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="text-7xl mb-4">{medal}</div>
        </motion.div>
        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
          {pct === 100 ? '¡Perfecto!' : pct >= 75 ? '¡Muy bien!' : pct >= 50 ? '¡Buen intento!' : '¡Sigue practicando!'}
        </h3>
        <p className="text-4xl font-bold mb-1" style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>
          {score}/{questions.length}
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{pct}% correcto</p>

        <div className="flex gap-3">
          <button
            onClick={restart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            <RotateCcw size={15} />
            Jugar de nuevo
          </button>
          <a
            href="https://github.com/DiegoEstela/disney-learning-game"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <ExternalLink size={15} />
            Ver código
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5" style={{ minHeight: 380 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏰</span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>
            Disney Quiz
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Trophy size={14} style={{ color: '#F59E0B' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{score}</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(74,159,217,0.15)', color: 'var(--accent)' }}>
            {current + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full mb-6 overflow-hidden" style={{ background: 'var(--border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl p-6 mb-6 text-center"
          style={{
            background: 'var(--bg-card)',
            border: `2px solid ${
              state === 'correct' ? '#22c55e' :
              state === 'wrong'   ? '#ef4444' :
              'var(--border)'
            }`,
            transition: 'border-color 0.2s',
          }}
        >
          <div className="text-5xl mb-4">{q.emoji}</div>
          <span
            className="text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full mb-3 inline-block"
            style={{ background: 'rgba(74,159,217,0.12)', color: 'var(--accent)' }}
          >
            {q.movie}
          </span>
          <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {q.question}
          </p>

          {/* Feedback icon */}
          <AnimatePresence>
            {state === 'correct' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="mt-3">
                <CheckCircle2 size={28} className="mx-auto" style={{ color: '#22c55e' }} />
              </motion.div>
            )}
            {state === 'wrong' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="mt-3">
                <XCircle size={28} className="mx-auto" style={{ color: '#ef4444' }} />
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  La respuesta era: {q.answer ? '✅ Verdadero' : '❌ Falso'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: state === 'playing' ? 1.03 : 1 }}
          whileTap={{ scale: state === 'playing' ? 0.97 : 1 }}
          onClick={() => answer(true)}
          disabled={state !== 'playing'}
          className="py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50"
          style={{
            background: wrongAnswer ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: `2px solid ${wrongAnswer ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            color: wrongAnswer ? '#ef4444' : '#22c55e',
          }}
        >
          ✅ Verdadero
        </motion.button>
        <motion.button
          whileHover={{ scale: state === 'playing' ? 1.03 : 1 }}
          whileTap={{ scale: state === 'playing' ? 0.97 : 1 }}
          onClick={() => answer(false)}
          disabled={state !== 'playing'}
          className="py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '2px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          ❌ Falso
        </motion.button>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
        ¿Te gustó el juego?{' '}
        <a
          href="https://github.com/DiegoEstela/disney-learning-game"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)' }}
          className="underline"
        >
          Ver el proyecto completo →
        </a>
      </p>
    </div>
  );
}
