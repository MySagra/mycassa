import { EnvProvider } from '@/lib/contexts/EnvContext';
import { getShowNumbers } from '@/lib/env';

export function EnvProviderWrapper({ children }: { children: React.ReactNode }) {
  const showNumbers = getShowNumbers();

  return (
    <EnvProvider showNumbers={showNumbers}>
      {children}
    </EnvProvider>
  );
}
