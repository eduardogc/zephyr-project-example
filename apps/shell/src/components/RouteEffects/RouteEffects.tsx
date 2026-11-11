import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router';

export const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Shop'],
  [/^\/products\//, 'Product'],
  [/^\/cart$/, 'Your cart'],
];
export const titleFor = (pathname: string) => `${TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Not found'} · Zephyr Shop`;

/** SPA navigation does not reload the page, so update the title and move focus for keyboard/AT users. */
export function RouteEffects({ mainRef }: { mainRef: RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    document.title = titleFor(pathname);
    if (first.current) first.current = false; // do not steal focus on the initial page load
    else mainRef.current?.focus();
  }, [pathname, mainRef]);
  return null;
}
