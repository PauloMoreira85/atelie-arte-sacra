/**
 * Confere se toda imagem referenciada no código existe em public/.
 *
 * Um caminho errado não quebra o build do Next: a página sobe e o visitante
 * vê o alt text no lugar da foto. Foi assim que a imagem da home ficou
 * quebrada em produção depois de uma troca de artes.
 *
 * Roda junto com o build (npm run build).
 */
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

async function arquivosEm(dir) {
  const saida = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await arquivosEm(caminho)));
    else if ([".ts", ".tsx"].includes(extname(item.name))) saida.push(caminho);
  }
  return saida;
}

const problemas = [];
for (const arquivo of await arquivosEm("src")) {
  const conteudo = await readFile(arquivo, "utf8");
  for (const [, caminho] of conteudo.matchAll(/["'](\/(?:produtos|marca)\/[^"']+)["']/g)) {
    if (!existsSync(join("public", caminho))) {
      problemas.push(`  ${arquivo}\n    → ${caminho} não existe em public/`);
    }
  }
}

if (problemas.length > 0) {
  console.error("\n❌ Imagens referenciadas que não existem:\n");
  console.error(problemas.join("\n"));
  console.error("\nCorrija o caminho ou adicione o arquivo em public/.\n");
  process.exit(1);
}

console.log("✓ imagens: todos os caminhos existem");
