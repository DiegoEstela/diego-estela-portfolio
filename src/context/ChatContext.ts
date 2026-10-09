import { createContext, useContext } from 'react';

interface ChatContextValue {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

export const ChatContext = createContext<ChatContextValue>({ isOpen: false, setIsOpen: () => {} });

export function useChatContext() {
  return useContext(ChatContext);
}
