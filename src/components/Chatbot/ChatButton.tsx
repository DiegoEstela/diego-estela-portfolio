import { useState, createContext, useContext } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatContextValue {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

export const ChatContext = createContext<ChatContextValue>({ isOpen: false, setIsOpen: () => {} });

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatButton() {
  const { t } = useTranslation();
  const { isOpen, setIsOpen } = useChatContext();
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {hovered && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-lg"
            style={{ background: 'var(--accent)' }}
          >
            {t('chatbot.badge')}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center relative"
        style={{
          background: 'var(--accent)',
          boxShadow: '0 0 30px var(--glow)',
        }}
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
