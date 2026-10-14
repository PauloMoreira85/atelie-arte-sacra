import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

// O painel lê sessão por cookie, então nunca pode ser pré-renderizado.
export const dynamic = "force-dynamic";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
