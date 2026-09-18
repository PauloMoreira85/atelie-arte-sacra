# Ateliê Arte Sacra

Loja online de peças de arte sacra impressas em 3D — luminárias, bustos,
devocionais e lembrancinhas, produzidas sob encomenda.

👉 **Para editar textos, preços, fotos ou ativar o pagamento, veja
[COMO-EDITAR.md](COMO-EDITAR.md).**

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** — paleta tirada da logo (dourado, creme, marrom)
- **Asaas** — checkout hospedado com Pix, cartão e boleto
- Carrinho no `localStorage`, sem banco de dados

## Rodar

```bash
npm install
npm run dev
```

## Estrutura

```
src/
  data/
    produtos.ts     ← catálogo: preços, textos, medidas, fotos
    loja.ts         ← contato, frete, domínio
  lib/
    carrinho.tsx    ← estado do carrinho (context + localStorage)
    asaas.ts        ← cliente da API de pagamento (só servidor)
  components/       ← cabeçalho, rodapé, card, galeria de compra
  app/
    api/checkout/   ← cria o pagamento (valida preço no servidor)
    loja/           ← grade e categorias
    produto/[slug]/ ← página da peça
    carrinho/       ← carrinho e dados do cliente
public/
  produtos/         ← fotos (.webp, duas versões por peça)
  marca/            ← logo e símbolo
3d/                 ← fotos originais, fora do site
```

## Segurança

- A chave da Asaas fica só no servidor (`server-only`), nunca no browser.
- **Os preços são sempre lidos do catálogo no servidor.** O browser envia
  apenas slug, acabamento e quantidade — assim ninguém consegue alterar o
  valor do pedido pelo DevTools.
- Dados de cartão nunca passam por aqui: o pagamento acontece na página
  hospedada da Asaas, o que mantém o projeto fora do escopo de PCI.
- CPF/CNPJ são validados pelos dígitos verificadores antes de criar a cobrança.
