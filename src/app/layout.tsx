import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { CarrinhoProvider } from "@/lib/carrinho";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { LOJA } from "@/data/loja";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(LOJA.url),
  title: {
    default: `${LOJA.nome} — Arte sacra impressa em 3D`,
    template: `%s · ${LOJA.nome}`,
  },
  description: LOJA.descricao,
  openGraph: {
    title: `${LOJA.nome} — Arte sacra impressa em 3D`,
    description: LOJA.descricao,
    type: "website",
    locale: "pt_BR",
    siteName: LOJA.nome,
  },
  icons: {
    icon: "/marca/simbolo.webp",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <CarrinhoProvider>
          <Cabecalho />
          <main className="flex-1">{children}</main>
          <Rodape />
        </CarrinhoProvider>
      </body>
    </html>
  );
}
