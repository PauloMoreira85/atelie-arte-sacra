import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Marca que as atualizações de segurança do Next são aplicadas por
    // agente. Definido na subida 16.4.0 → 16.4.3.
    agentUpgrade: "security",
  },
};

export default nextConfig;
