import type { MetadataRoute } from "next";
import { listarProdutos, listarCategorias } from "@/lib/catalogo";
import { LOJA } from "@/data/loja";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [PRODUTOS, CATEGORIAS] = await Promise.all([listarProdutos(), listarCategorias()]);
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
