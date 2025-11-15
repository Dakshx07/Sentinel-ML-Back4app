import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Add this interface to satisfy TypeScript for the experimental View Transitions API
interface DocumentWithViewTransition extends Document {
    startViewTransition(updateCallback: () => Promise<void> | void): ViewTransition;
}
interface ViewTransition {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('sentinel-theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default for SSR or non-browser env
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const darkHljs = document.getElementById('hljs-dark-theme') as HTMLLinkElement | null;
    const lightHljs = document.getElementById('hljs-light-theme') as HTMLLinkElement | null;

    if (theme === 'dark') {
      root.classList.add('dark');
      if (darkHljs) darkHljs.disabled = false;
      if (lightHljs) lightHljs.disabled = true;
    } else {
      root.classList.remove('dark');
      if (darkHljs) darkHljs.disabled = true;
      if (lightHljs) lightHljs.disabled = false;
    }
    localStorage.setItem('sentinel-theme', theme);
  }, [theme]);

  const toggleTheme = (event?: React.MouseEvent) => {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';

    // Fallback for browsers that don't support the View Transitions API
    if (!(document as DocumentWithViewTransition).startViewTransition) {
        setTheme(newTheme);
        return;
    }
    
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    (document as DocumentWithViewTransition).startViewTransition(() => {
        document.documentElement.style.setProperty('--x', `${x}px`);
        document.documentElement.style.setProperty('--y', `${y}px`);
        setTheme(newTheme);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};