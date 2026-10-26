# Como editar o site

Guia prático. Você não precisa saber programar para fazer o que está aqui.

---

## ⚠️ O que PRECISA ser trocado antes de vender

Estes valores são placeholders. O site funciona com eles, mas estão errados.

### 1. Contato e redes — `src/data/loja.ts`

```ts
whatsapp: "5527992314183",        // ✅ já configurado
instagram: "atelie.arte.sacra",   // ✅ já configurado
email: "contato@atelieartesacra.com.br",  // ← TROCAR se usar outro
cidade: "Colatina - Espírito Santo",  // ✅ já configurado
url: "https://atelieartesacra.com.br",  // ✅ já configurado
```

Ainda falta o **e-mail** — hoje é um valor de exemplo. Se você não tiver um
e-mail no domínio, pode trocar por um Gmail mesmo; o importante é ser um
endereço que você leia.

### 2. Preços e medidas — `src/data/produtos.ts`

Todo item marcado com `// REVISAR` é um chute meu. As medidas confirmadas
(vieram nas artes) estão marcadas com ✅: Porta Terço e Nossa Senhora das
Graças.

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

Esses valores são o frete de reserva. O cálculo real por CEP já está
integrado — veja a seção **Ativar o frete calculado** mais abaixo.

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

**Fundo das artes:** o site é escuro e as artes são feitas em fundo preto com
a logo embutida. Se alguma peça vier com fundo de cor diferente, dá para
ajustar só ela em `src/data/produtos.ts`:

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

### Domínio próprio

O domínio **atelieartesacra.com.br** já está ligado ao projeto na Vercel e os
registros de DNS já foram criados no Registro.br:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` (vazio) | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

O `www` redireciona para o endereço sem `www`, que é o oficial.

Se algum dia a Vercel pedir valores diferentes (ela está migrando para
`216.150.1.1` e um CNAME próprio do projeto), os antigos continuam
funcionando — só troque se der problema.

O certificado HTTPS é emitido sozinho pela Vercel, sem custo, assim que o DNS
propaga. Não precisa fazer nada.

---

## 📦 Ativar o frete calculado (Melhor Envio)

Hoje o site cobra **frete fixo** (R$ 25, grátis acima de R$ 300). Para calcular
o valor real por CEP, ative o Melhor Envio:

1. Crie a conta em [melhorenvio.com.br](https://melhorenvio.com.br) — não tem
   mensalidade, você paga só a etiqueta (com desconto sobre o balcão).
2. No painel: **Gerenciar → Tokens → Novo Token**. Dê um nome e marque a
   permissão **"Cotação de fretes"** — só isso, nada mais. Um token que só
   cota não consegue comprar etiqueta, então mesmo que vaze ninguém gasta
   seu dinheiro.
3. Preencha no `.env.local` (e no painel da Vercel):

```env
MELHOR_ENVIO_TOKEN="seu-token-aqui"
CEP_ORIGEM="29700010"
EMAIL_CONTATO="seu@email.com.br"
```

O `CEP_ORIGEM` já está preenchido com **29700-010** (Centro de Colatina). Se
as encomendas saírem de outro endereço, troque — mas entre bairros da mesma
cidade a diferença de frete é mínima.

O `EMAIL_CONTATO` é exigido pelo Melhor Envio para identificar a aplicação.

### Antes de ativar: pese as caixas ⚖️

Em `src/data/produtos.ts`, cada peça tem um bloco `envio` com **peso e
medidas da caixa**, hoje preenchido com estimativa:

```ts
envio: {
  pesoG: 450,                                        // REVISAR
  caixa: { altura: 23, largura: 17, comprimento: 19 }, // REVISAR
},
```

**Meça e pese uma caixa real de cada peça.** Os Correios cobram pelo maior
valor entre o peso real e o peso cubado (altura × largura × comprimento ÷
6000) — se a estimativa estiver baixa, o site cobra menos do que você paga e
a diferença sai do seu bolso em toda venda.

### Se der problema

O site **nunca deixa de vender** por causa do frete: se o Melhor Envio estiver
fora do ar ou o token vencer, ele volta sozinho para o frete fixo e marca o
valor como estimado para o cliente. Você acerta a diferença no envio.

⚠️ Se você usar token do fluxo OAuth em vez do token do painel, ele **vence em
30 dias** e precisa ser renovado. Prefira o token do painel.

---

## 🧾 Nota fiscal

⚠️ **Importante para Colatina-ES:** o Decreto nº 6.335-R/2026 tornou
obrigatório, desde 01/04/2026, que MEI com atividade sujeita a ICMS tenha
**Inscrição Estadual** e **emita documento fiscal eletrônico**. Venda de peça
impressa em 3D é mercadoria, ou seja, operação com ICMS.

Confirme com seu contador se a sua CNAE está na lista e se a Inscrição
Estadual já está ativa.

Para emitir, o plano é usar o **Base by Asaas**, que já é usado em outros
projetos. Para e-commerce com entrega por transportadora o modelo correto é
**NF-e 55** (a NFC-e 65 não cobre venda interestadual).

Alternativas gratuitas oferecidas pelo próprio ES, caso queira começar sem
custo: app **Nota Fiscal Fácil (NFF)** — emite pelo celular, sem certificado
digital — e o emissor gratuito do SEBRAE.

---

## 🔐 Painel de administração

Acesse em **/painel** (ex.: https://atelieartesacra.com.br/painel) com seu
usuário e PIN de 6 dígitos.

Pelo painel você edita, sem mexer em código e sem esperar deploy:
preço, nome, resumo e descrição, medidas, peso e caixa de envio, acabamentos,
imagens, prazo de produção, e se a peça aparece na loja e na home.

**A alteração vale na hora** — salvou, o site já mostra.

### Segurança

- O PIN é guardado só como código embaralhado (hash). Nem eu consigo ler.
- Após 4 tentativas erradas, o acesso trava por 1 minuto, depois 2, 4, 8, 16
  e até 30 minutos. Isso torna inviável alguém tentar adivinhar o PIN.
- Toda alteração de preço fica registrada com quem fez e os valores antes e
  depois.

### Adicionar ou remover uma pessoa

Me peça, ou rode no SQL Editor do Supabase:

```sql
-- criar ou trocar o PIN de alguém
select public.definir_usuario_painel('usuario', 'Nome da Pessoa', '123456');

-- tirar o acesso sem apagar o histórico
update public.usuarios_painel set ativo = false where usuario = 'usuario';
```

### Se o banco cair

O site **continua funcionando**: ele volta a ler o catálogo de
`src/data/produtos.ts` automaticamente. O painel fica fora do ar, a loja não.

⚠️ Mas atenção: nesse caso a loja mostra os preços do ARQUIVO, que podem estar
desatualizados. Se você mudar preços pelo painel, vale pedir para eu
sincronizar o arquivo de vez em quando.

---

## 📈 Rastreamento de anúncios (Google e Meta)

O site já manda os eventos de loja para o **Google Analytics 4**, o
**Google Ads** e o **Meta Pixel** (Instagram/Facebook). Falta só preencher
os IDs. **Cada ferramenta só carrega se o ID dela estiver preenchido** —
vazio, ela fica desligada e o site funciona igual.

### Onde configurar

Na Vercel: **Settings → Environment Variables** (ambiente *Production*),
depois um novo deploy. Para testar na sua máquina, no `.env.local`.

| Variável | Onde pegar | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_GA4_ID` | Google Analytics → Administrador → Fluxos de dados → ID da métrica | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_GADS_ID` | Google Ads → Metas → Conversões → ação de compra → Configuração da tag | `AW-123456789` |
| `NEXT_PUBLIC_GADS_PURCHASE_LABEL` | mesmo lugar: o texto depois da `/` em `send_to` | `AbCdEfGhIjKl` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta → Gerenciador de Eventos → Fontes de dados → ID do pixel | `1234567890123456` |

### Eventos enviados

Todos com moeda **BRL**, e os de produto com id (slug), nome, acabamento,
preço e quantidade.

| Quando | GA4 / Google Ads | Meta |
|---|---|---|
| Cada página aberta, inclusive navegando sem recarregar | `page_view` | `PageView` |
| Página de uma peça | `view_item` | `ViewContent` |
| Botão "Adicionar ao carrinho" | `add_to_cart` | `AddToCart` |
| Botão "Ir para o pagamento" | `begin_checkout` | `InitiateCheckout` |
| Volta da Asaas com o pagamento aprovado | `purchase` + conversão do Google Ads | `Purchase` |
| Clique em qualquer link do WhatsApp | `generate_lead` | `Contact` |

O **painel** (`/painel`) não é medido.

### Como a compra é contada

O pagamento é feito na página da Asaas. Quando o Pix é pago ou o cartão
aprovado, a Asaas devolve o cliente para `/pedido/confirmado?ref=AAS-...`.
Ao abrir o pagamento, o site guarda no navegador do cliente os itens e o
total (com o frete recotado no servidor); na volta, dispara a compra com
esse valor e com o **número do pedido** (`AAS-...`) como `transaction_id` no
Google e `eventID` no Meta.

- Recarregar a página de confirmação **não** conta a venda de novo.
- Se o cliente pagar num aparelho e voltar em outro, ou abrir o link de
  confirmação depois de dias, a venda não é medida — preferimos perder uma
  conversão rara a inflar os números.

### De onde veio cada venda

Quando alguém entra por um anúncio, o site guarda por 90 dias os parâmetros
`utm_*`, `gclid`, `gbraid`, `wbraid` e `fbclid` e os envia junto com o
pedido. Hoje eles aparecem no log da Vercel (`[checkout] origem do pedido`).
Para gravar no banco, rode uma vez o arquivo `criar-pedidos-origem.sql` no
SQL Editor do Supabase: a partir daí cada checkout aberto ganha uma linha na
tabela `pedidos_origem`, ligada ao extrato da Asaas pela referência.

### Conferir se está funcionando

- **Meta:** extensão *Meta Pixel Helper* no Chrome, ou Gerenciador de Eventos
  → Testar eventos.
- **Google:** extensão *Tag Assistant*, ou GA4 → Relatórios → Tempo real.

---

## O que ainda não existe

Coisas que valem a pena num segundo momento — me avise quando quiser:

- **Confirmação automática de pagamento** (webhook da Asaas). Hoje o cliente
  é redirecionado de volta e o pedido é dado como recebido; a confirmação real
  você vê no painel da Asaas.
- **Compra automática de etiqueta** — hoje o site cota o frete, mas a
  etiqueta você compra no painel do Melhor Envio. Automatizar isso tem risco
  (etiqueta comprada por engano custa dinheiro) e pouco ganho no volume atual.
- **Painel de pedidos** — o painel atual cuida só dos produtos; os pedidos
  continuam no painel da Asaas. O projeto Nexo 3D já tem essa parte pronta,
  junto com emissão de NF-e pelo Base ERP e compra de etiqueta no Melhor
  Envio — dá para portar quando quiser.
- **Estoque** — faz sentido só se você passar a produzir por antecipação.
