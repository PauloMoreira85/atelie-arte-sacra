import type { MetadataRoute } from "next";
import { LOJA } from "@/data/loja";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/carrinho", "/pedido/"],
    },
    sitemap: `${LOJA.url}/sitemap.xml`,
  };
}
