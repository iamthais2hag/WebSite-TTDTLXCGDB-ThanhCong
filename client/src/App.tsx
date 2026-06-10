import "./App.css";
import { Layout } from "./components/layout/Layout";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { CenterOverviewPage } from "./pages/CenterOverviewPage";
import { EnrollmentPage } from "./pages/EnrollmentPage";
import { HomePage } from "./pages/HomePage";
import { LegalPage } from "./pages/LegalPage";
import { LookupPage } from "./pages/LookupPage";
import { type AppRoutePath, ROUTES, useAppRoute } from "./routing";
import { usePageMeta } from "./seo";

export function AppRouteContent({ route }: { route: AppRoutePath }) {
  if (route === ROUTES.enrollment) {
    return <EnrollmentPage />;
  }

  if (route === ROUTES.lookup) {
    return <LookupPage />;
  }

  if (route === ROUTES.announcements) {
    return <AnnouncementsPage />;
  }

  if (route === ROUTES.legal) {
    return <LegalPage />;
  }

  return (
    <>
      <HomePage />
      <CenterOverviewPage />
    </>
  );
}

export function App() {
  const route = useAppRoute();
  usePageMeta(route);

  return (
    <Layout>
      <AppRouteContent route={route} />
    </Layout>
  );
}
