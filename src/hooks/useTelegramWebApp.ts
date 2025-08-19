import { useEffect, useState, useCallback } from 'react';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText(text: string): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegramWebApp = () => {
  const [isInTWA, setIsInTWA] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramWebApp['initDataUnsafe']['user'] | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      setIsInTWA(true);
      setUser(tg.initDataUnsafe.user || null);
      setColorScheme(tg.colorScheme);

      // Initialize the app
      tg.ready();
      tg.expand();

      // Apply theme
      if (tg.themeParams.bg_color) {
        document.body.style.backgroundColor = tg.themeParams.bg_color;
      }

      // Set up theme change listener
      const handleThemeChange = () => {
        setColorScheme(tg.colorScheme);
      };

      // Note: Telegram WebApp doesn't have a direct theme change event
      // but we can check periodically or on visibility change
      const interval = setInterval(() => {
        if (tg.colorScheme !== colorScheme) {
          handleThemeChange();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [colorScheme]);

  const showBackButton = useCallback((callback?: () => void) => {
    if (webApp?.BackButton) {
      webApp.BackButton.show();
      if (callback) {
        webApp.BackButton.onClick(callback);
      }
    }
  }, [webApp]);

  const hideBackButton = useCallback(() => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  }, [webApp]);

  const showMainButton = useCallback((text: string, callback?: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.show();
      webApp.MainButton.enable();
      if (callback) {
        webApp.MainButton.onClick(callback);
      }
    }
  }, [webApp]);

  const hideMainButton = useCallback(() => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  }, [webApp]);

  const hapticFeedback = useCallback((type: 'impact' | 'notification' | 'selection', style?: any) => {
    if (webApp?.HapticFeedback) {
      switch (type) {
        case 'impact':
          webApp.HapticFeedback.impactOccurred(style || 'medium');
          break;
        case 'notification':
          webApp.HapticFeedback.notificationOccurred(style || 'success');
          break;
        case 'selection':
          webApp.HapticFeedback.selectionChanged();
          break;
      }
    }
  }, [webApp]);

  const close = useCallback(() => {
    if (webApp) {
      webApp.close();
    } else {
      // Fallback for non-TWA environments
      window.close();
    }
  }, [webApp]);

  const sendData = useCallback((data: any) => {
    if (webApp) {
      webApp.sendData(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, [webApp]);

  return {
    isInTWA,
    webApp,
    user,
    colorScheme,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    hapticFeedback,
    close,
    sendData,
    isExpanded: webApp?.isExpanded ?? false,
    viewportHeight: webApp?.viewportHeight ?? window.innerHeight,
    platform: webApp?.platform ?? 'web',
  };
};