import { createContext } from 'react';

export interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggle: () => {},
  theme: 'dark',
  toggleTheme: () => {},
});
