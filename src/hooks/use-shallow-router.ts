import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

export function useShallowRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const push = useCallback((url: string, options?: { scroll?: boolean }) => {
    window.history.pushState({}, '', url);
    
    startTransition(() => {
      router.push(url, { scroll: options?.scroll ?? false });
    });
  }, [router]);

  const replace = useCallback((url: string, options?: { scroll?: boolean }) => {
    window.history.replaceState({}, '', url);
    
    startTransition(() => {
      router.replace(url, { scroll: options?.scroll ?? false });
    });
  }, [router]);

  const updateSearchParams = useCallback((
    updater: (params: URLSearchParams) => void,
    options?: { scroll?: boolean; replace?: boolean }
  ) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    updater(currentParams);
    
    const newUrl = `${pathname}?${currentParams.toString()}`;
    
    if (options?.replace) {
      replace(newUrl, { scroll: options?.scroll });
    } else {
      push(newUrl, { scroll: options?.scroll });
    }
  }, [pathname, searchParams, push, replace]);

  return {
    push,
    replace,
    updateSearchParams,
    isPending,
  };
}