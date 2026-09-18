import type { MetadataRoute } from "next";
import { PRODUTOS, CATEGORIAS } from "@/data/produtos";
import { LOJA } from "@/data/loja";

export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();

  return [
    { url: LOJA.url, lastModified: agora, priority: 1 },
    { url: `${LOJA.url}/loja`, lastModified: agora, priority: 0.9 },
    { url: `${LOJA.url}/sobre`, lastModified: agora, priority: 0.5 },
    ...Object.keys(CATEGORIAS).map((c) => ({
      url: `${LOJA.url}/loja/${c}`,
      lastModified: agora,
      priority: 0.7,
    })),
    ...PRODUTOS.map((p) => ({
      url: `${LOJA.url}/produto/${p.slug}`,
      lastModified: agora,
      priority: 0.8,
    })),
  ];
}
