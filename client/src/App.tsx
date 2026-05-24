import "./App.css";
import { Layout } from "./components/layout/Layout";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { EnrollmentPage } from "./pages/EnrollmentPage";
import { HomePage } from "./pages/HomePage";
import { LegalPage } from "./pages/LegalPage";
import { LookupPage } from "./pages/LookupPage";

export function App() {
  return (
    <Layout>
      <HomePage />
      <LookupPage />
      <AnnouncementsPage />
      <LegalPage />
      <EnrollmentPage />
    </Layout>
  );
}
