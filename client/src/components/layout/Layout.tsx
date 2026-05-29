import type { ReactNode } from "react";
import { FloatingContact } from "../floating/FloatingContact";
import { Footer } from "./Footer";
import { Header } from "./Header";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="site-shell">
      <Header />
      <main className="site-main">{children}</main>
      <FloatingContact />
      <Footer />
    </div>
  );
}
