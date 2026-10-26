import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { CarrinhoProvider } from "@/lib/carrinho";
import { listarProdutos } from "@/lib/catalogo";
import { Cabecalho } from "@/components/Cabecalho";
import { BarraPainel } from "@/components/BarraPainel";
import { Rodape } from "@/components/Rodape";
import { Rastreamento } from "@/components/Rastreamento";
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

// Rastreamento para tráfego pago. Cada ferramenta só carrega se o ID dela
// estiver no ambiente (veja COMO-EDITAR.md > Rastreamento de anúncios).
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID?.trim();
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID?.trim();
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
// Um único gtag.js atende GA4 e Google Ads; o ID na URL é só o primeiro.
const ID_GTAG = GA4_ID || GADS_ID;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // O carrinho roda no browser e precisa dos preços atuais para somar.
  // Buscamos aqui, no servidor, e passamos por prop.
  const catalogo = await listarProdutos();

  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        {/* Antes do conteúdo: assim o page_view sai antes do view_item. */}
        <Rastreamento />
        <CarrinhoProvider catalogo={catalogo}>
          <BarraPainel />
          <Cabecalho />
          <main className="flex-1">{children}</main>
          <Rodape />
        </CarrinhoProvider>

        {ID_GTAG && (
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID_GTAG)}`}
            strategy="afterInteractive"
          />
        )}
        {META_PIXEL_ID && (
          <>
            {/* A fila do fbq precisa existir ANTES do fbevents.js rodar,
                senão ele quebra com "fbq is not defined". É o início do
                snippet oficial do Meta; o init fica em lib/rastreamento. */}
            <Script id="meta-pixel-fila" strategy="beforeInteractive">
              {`!function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window);`}
            </Script>
            <Script
              src="https://connect.facebook.net/en_US/fbevents.js"
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  );
}
