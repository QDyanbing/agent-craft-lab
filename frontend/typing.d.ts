import type { Language } from '@/i18n/languages';
import type { router } from '@config/router';
import type { RouteComponent } from '@tanstack/react-router';
import type { ResourceKey } from 'i18next';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }

  namespace I18n {
    interface Locale {
      language: Language;
      namespace: string;
      resources: ResourceKey;
    }
  }

  type RouteConfig =
    | {
        children?: RouteConfig[];
        component: () => Promise<{ default: RouteComponent }>;
        path: string;
        redirect?: never;
      }
    | {
        children?: RouteConfig[];
        component?: never;
        path: string;
        redirect: { to: string; search?: true; hash?: true };
      }
    | {
        children: RouteConfig[];
        component: () => Promise<{ default: RouteComponent }>;
        path?: never;
        redirect?: never;
      };
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
