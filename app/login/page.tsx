"use client"

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login/login-card/login-form";
import { useTheme } from 'next-themes';
import { Moon, Sun, } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Mappa codice errore (passato come ?error=) -> chiave di traduzione
const ERROR_MESSAGE_KEYS: Record<string, string> = {
  session_expired: 'loginForm.sessionExpired',
  unauthorized: 'loginForm.sessionExpired',
  forbidden: 'loginForm.accessDenied',
};

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme toggle after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostra un messaggio se reindirizzati al login con un codice errore (?error=)
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (!error) return;
    const key = ERROR_MESSAGE_KEYS[error] ?? 'loginForm.sessionExpired';
    toast.error(t(key));
    // Rimuovi il parametro dall'URL così il messaggio non riappare al refresh
    window.history.replaceState({}, '', '/login');
  }, [t]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>

      <div className="absolute bottom-0 text-sm text-muted-foreground select-none">
        <Link href={"https://www.mysagra.com/"} target="_blank" rel="noopener noreferrer">
          {"Powered by"}
          <Button variant={"link"} className="text-primary p-1.5">
            {"MySagra"}
          </Button>
        </Link>
      </div>
      <div className="absolute bottom-0 right-0 m-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
        </Button>
      </div>
    </div>
  );
}
