# Como editar o site

Guia prático. Você não precisa saber programar para fazer o que está aqui.

---

## ⚠️ O que PRECISA ser trocado antes de vender

Estes valores são placeholders. O site funciona com eles, mas estão errados.

### 1. Contato e redes — `src/data/loja.ts`

```ts
whatsapp: "5500000000000",   // ← seu número: 55 + DDD + número, só dígitos
instagram: "atelie.artesacra",
email: "contato@atelieartesacra.com.br",
cidade: "Sua Cidade - UF",
url: "https://www.atelieartesacra.com.br",  // ← domínio final
```

O WhatsApp é o mais importante: sem ele, todos os botões de "falar com a gente"
levam para um número inexistente.

### 2. Preços e medidas — `src/data/produtos.ts`

Todo item marcado com `// REVISAR` é um chute meu. A única medida confirmada é
a do Porta Terço (17 × 11 × 13 cm), que veio na foto.

Preços são em **centavos**: `18990` = R$ 189,90.

```ts
preco: 18990,  // REVISAR
medidas: { altura: 22, largura: 17, profundidade: 9 },  // REVISAR
```

### 3. Frete — `src/data/loja.ts`

```ts
freteGratisAcima: 30000,  // R$ 300,00
freteFixo: 2500,          // R$ 25,00
```

Hoje o frete é um valor fixo. Se quiser cálculo real por CEP (Correios,
Melhor Envio), me avise que integro.

---

## 💳 Ativar o pagamento

O site está pronto para receber Pix, cartão e boleto pela Asaas, mas ainda sem
a chave. **Enquanto a chave não for preenchida, o site funciona normalmente** e
o botão de pagamento avisa o cliente para fechar pelo WhatsApp.

### Passo a passo

1. Crie a conta em [asaas.com](https://www.asaas.com) (ou em
   [sandbox.asaas.com](https://sandbox.asaas.com) para testar sem dinheiro real).
2. Vá em **Configurações → Integrações → Chave de API** e gere a chave.
3. Abra o arquivo `.env.local` e cole:

```env
ASAAS_API_KEY="$aact_SUA_CHAVE_AQUI"
```

### ⚠️ A chave PRECISA estar entre aspas duplas

A chave da Asaas começa com `$`. Em arquivos `.env`, o cifrão é lido como
"variável", e sem aspas a chave chega **vazia** no servidor — o pagamento
simplesmente não abre, sem erro visível.

```env
✅ ASAAS_API_KEY="$aact_hmlg_000000..."
❌ ASAAS_API_KEY=$aact_hmlg_000000...
```

O código detecta esse caso e avisa nos logs, mas é melhor acertar de primeira.

4. Reinicie o servidor (`npm run dev`). Alterar o `.env.local` com o servidor
   rodando **não** tem efeito: é preciso parar e subir de novo.

O ambiente (teste ou produção) é detectado sozinho: chaves com `_hmlg_` vão
para o sandbox, as demais para produção.

---

## 📸 Trocar as fotos dos produtos

As fotos ficam em `public/produtos/`. Cada peça tem duas versões:

| Arquivo | Onde aparece |
|---|---|
| `nome.webp` | Página do produto (imagem grande) |
| `nome-card.webp` | Grade da loja (quadrada) |

Para trocar, substitua os arquivos mantendo os mesmos nomes.

**Fundo das fotos:** o site é claro, então fotos em fundo branco ou claro
funcionam melhor. Se alguma peça tiver fundo de cor diferente, dá para ajustar
só ela em `src/data/produtos.ts`:

```ts
fundoCard: "#f3ece2",  // cor de fundo só deste card
```

---

## ✏️ Mexer no catálogo

Tudo em `src/data/produtos.ts`.

### Mudar um texto
Edite `nome`, `resumo` ou `descricao` do produto. `descricao` é uma lista —
cada item vira um parágrafo.

### Adicionar uma peça
Copie um bloco inteiro `{ ... }`, cole no fim da lista e ajuste. O `slug` é o
endereço da página (`/produto/slug`) e precisa ser único, sem espaços nem
acentos.

### Tirar uma peça de venda
Apague o bloco dela ou comente com `//`. O carrinho é limpo automaticamente:
se um cliente tinha a peça salva, ela some sem quebrar nada.

### Marcar como destaque
`destaque: true` faz a peça aparecer na home, em "As mais pedidas".

---

## 🖥️ Rodar na sua máquina

```bash
npm install
npm run dev
```

Abre em http://localhost:3000. Para testar a versão final:

```bash
npm run build
npm start
```

---

## 🚀 Publicar

O jeito mais simples é a [Vercel](https://vercel.com) (gratuita para este caso):

1. Entre com a conta do GitHub e importe o repositório `atelie-arte-sacra`.
2. Em **Environment Variables**, adicione `ASAAS_API_KEY` com a sua chave.
   (No painel da Vercel não precisa de aspas — o problema do `$` é só no
   arquivo `.env`.)
3. Deploy. A cada `git push`, o site atualiza sozinho.

Depois, em **Settings → Domains**, você liga o domínio próprio.

---

## O que ainda não existe

Coisas que valem a pena num segundo momento — me avise quando quiser:

- **Confirmação automática de pagamento** (webhook da Asaas). Hoje o cliente
  é redirecionado de volta e o pedido é dado como recebido; a confirmação real
  você vê no painel da Asaas.
- **Cálculo de frete por CEP** (hoje é valor fixo).
- **Painel para gerenciar pedidos** (hoje é o painel da Asaas + WhatsApp).
- **Estoque** — faz sentido só se você passar a produzir por antecipação.
