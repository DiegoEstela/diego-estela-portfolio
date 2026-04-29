import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '@/types';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mr-2 mt-0.5"
          style={{ background: 'var(--accent)' }}
        >
          DE
        </div>
      )}
      <div
        className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? { background: 'var(--accent)', color: '#fff', borderBottomRightRadius: 4 }
            : { background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
        }
      >
        {message.content}
      </div>
    </motion.div>
  );
}
