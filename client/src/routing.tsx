import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

export const ROUTES = {
  announcements: "/thong-bao",
  enrollment: "/tuyen-sinh",
  home: "/",
  legal: "/phap-ly",
  lookup: "/tra-cuu",
} as const;

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES];

const ROUTE_CHANGE_EVENT = "thanhcong-route-change";
const routePaths = Object.values(ROUTES) as AppRoutePath[];

function trimTrailingSlash(pathname: string) {
  if (pathname.length <= 1) {
    return "/";
  }

  return pathname.replace(/\/+$/, "");
}

function isKnownRoute(pathname: string): pathname is AppRoutePath {
  return routePaths.includes(pathname as AppRoutePath);
}

function routeFromHash(hash: string): AppRoutePath | null {
  if (hash === "#tuyen-sinh") {
    return ROUTES.enrollment;
  }

  if (hash === "#tra-cuu") {
    return ROUTES.lookup;
  }

  if (hash === "#thong-bao") {
    return ROUTES.announcements;
  }

  if (hash === "#phap-ly") {
    return ROUTES.legal;
  }

  if (hash === "#trang-chu") {
    return ROUTES.home;
  }

  return null;
}

export function normalizePathname(pathname: string): AppRoutePath {
  const normalizedPath = trimTrailingSlash(pathname);

  if (isKnownRoute(normalizedPath)) {
    return normalizedPath;
  }

  return ROUTES.home;
}

export function isRouteActive(currentRoute: AppRoutePath, targetRoute: AppRoutePath) {
  return currentRoute === targetRoute;
}

function getCurrentRoute(): AppRoutePath {
  if (typeof window === "undefined") {
    return ROUTES.home;
  }

  if (window.location.pathname === "/") {
    const legacyHashRoute = routeFromHash(window.location.hash);

    if (legacyHashRoute) {
      return legacyHashRoute;
    }
  }

  return normalizePathname(window.location.pathname);
}

function notifyRouteChange() {
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
}

export function navigateToRoute(route: AppRoutePath) {
  if (typeof window === "undefined") {
    return;
  }

  const nextRoute = normalizePathname(route);

  if (
    window.location.pathname !== nextRoute ||
    window.location.search !== "" ||
    window.location.hash !== ""
  ) {
    window.history.pushState(null, "", nextRoute);
  }

  window.scrollTo({
    behavior: "auto",
    left: 0,
    top: 0,
  });
  notifyRouteChange();
}

export function useAppRoute() {
  const [currentRoute, setCurrentRoute] = useState<AppRoutePath>(() => getCurrentRoute());

  useEffect(() => {
    const legacyHashRoute = routeFromHash(window.location.hash);

    if (window.location.pathname === "/" && legacyHashRoute) {
      window.history.replaceState(null, "", legacyHashRoute);
    }

    const syncRoute = () => setCurrentRoute(getCurrentRoute());

    syncRoute();
    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener(ROUTE_CHANGE_EVENT, syncRoute);

    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener(ROUTE_CHANGE_EVENT, syncRoute);
    };
  }, []);

  return currentRoute;
}

function shouldHandleRouteClick(event: MouseEvent<HTMLAnchorElement>) {
  const anchor = event.currentTarget;

  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    (!anchor.target || anchor.target === "_self")
  );
}

type RouteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  to: AppRoutePath;
};

export function RouteLink({ children, onClick, to, ...props }: RouteLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (!shouldHandleRouteClick(event)) {
      return;
    }

    event.preventDefault();
    navigateToRoute(to);
  }

  return (
    <a {...props} href={to} onClick={handleClick}>
      {children}
    </a>
  );
}

type RouteNavLinkProps = RouteLinkProps & {
  activeClassName: string;
};

export function RouteNavLink({
  activeClassName,
  className,
  to,
  ...props
}: RouteNavLinkProps) {
  const currentRoute = useAppRoute();
  const routeIsActive = isRouteActive(currentRoute, to);
  const linkClassName = routeIsActive
    ? `${className ?? ""} ${activeClassName}`.trim()
    : className;

  return <RouteLink {...props} className={linkClassName} to={to} />;
}
