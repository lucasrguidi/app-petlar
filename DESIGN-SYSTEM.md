# PetLar Design System

> Sistema de design acolhedor e amigável para gestão de adoção de gatos

---

## Índice

1. [Filosofia de Design](#filosofia-de-design)
2. [Tokens de Design](#tokens-de-design)
3. [Tipografia](#tipografia)
4. [Cores](#cores)
5. [Espaçamento](#espaçamento)
6. [Border Radius](#border-radius)
7. [Sombras](#sombras)
8. [Animações](#animações)
9. [Componentes](#componentes)
10. [Guidelines: Site Público vs Admin](#guidelines-site-público-vs-admin)
11. [Acessibilidade](#acessibilidade)
12. [Ícones](#ícones)

---

## Filosofia de Design

### Princípios Fundamentais

O PetLar transmite **acolhimento** e **confiança**. Cada elemento visual deve evocar a sensação de um lar seguro para os animais.

| Princípio     | Descrição                                                   |
| ------------- | ----------------------------------------------------------- |
| **Acolhedor** | Bordas arredondadas, cores suaves, sensação de calor humano |
| **Confiável** | Hierarquia clara, espaçamento generoso, fácil de usar       |
| **Amigável**  | Micro-interações suaves, feedback visual claro              |
| **Acessível** | Contraste adequado, navegação intuitiva                     |

### Dois Mundos, Uma Identidade

```
┌─────────────────────────────────────────────────────────────────┐
│                         SITE PÚBLICO                             │
│  Emocional • Ilustrativo • Elementos temáticos de gatos         │
│  Foco: Conectar pessoas aos animais                             │
├─────────────────────────────────────────────────────────────────┤
│                         PAINEL ADMIN                             │
│  Funcional • Clean • Neutro profissional                        │
│  Foco: Produtividade e gestão eficiente                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tokens de Design

### Variáveis CSS (index.css)

```css
@theme inline {
  /* ═══════════════════════════════════════════════════════════
     TIPOGRAFIA
     ═══════════════════════════════════════════════════════════ */

  --font-sans: 'DM Sans Variable', 'DM Sans', system-ui, sans-serif;
  --font-display: 'Outfit Variable', 'Outfit', system-ui, sans-serif;

  /* ═══════════════════════════════════════════════════════════
     BORDER RADIUS - "Acolhedor"
     Bordas generosas transmitem suavidade
     ═══════════════════════════════════════════════════════════ */

  --radius-xs: 0.375rem; /* 6px - chips, badges */
  --radius-sm: 0.5rem; /* 8px - inputs, botões pequenos */
  --radius-md: 0.75rem; /* 12px - cards internos */
  --radius-lg: 1rem; /* 16px - cards principais */
  --radius-xl: 1.25rem; /* 20px - modais, sheets */
  --radius-2xl: 1.5rem; /* 24px - cards destacados */
  --radius-3xl: 2rem; /* 32px - elementos hero */
  --radius-full: 9999px; /* círculos, pills */

  /* ═══════════════════════════════════════════════════════════
     CORES - LIGHT THEME
     Paleta: Azul Céu + Marrom Terra + Laranja Vibrante
     ═══════════════════════════════════════════════════════════ */

  /* Fundos */
  --color-background: #aec7e2; /* Azul céu - acolhedor */
  --color-foreground: #783201; /* Marrom terra - legível */

  /* Cards e superfícies */
  --color-card: #ffffff;
  --color-card-foreground: #783201;

  /* Popovers e dropdowns */
  --color-popover: #ffffff;
  --color-popover-foreground: #783201;

  /* Ação primária - CTA */
  --color-primary: #e35915; /* Laranja vibrante - energia */
  --color-primary-foreground: #ffffff;

  /* Ação secundária */
  --color-secondary: #d4e3f3; /* Azul mais claro */
  --color-secondary-foreground: #783201;

  /* Estados muted */
  --color-muted: #c5d8ee;
  --color-muted-foreground: #8b5a2b; /* Marrom médio */

  /* Accent/hover */
  --color-accent: #f07b3d; /* Laranja suave */
  --color-accent-foreground: #ffffff;

  /* Destrutivo */
  --color-destructive: #dc2626;
  --color-destructive-foreground: #ffffff;

  /* Sucesso */
  --color-success: #16a34a;
  --color-success-foreground: #ffffff;

  /* Alerta */
  --color-warning: #f59e0b;
  --color-warning-foreground: #783201;

  /* Info */
  --color-info: #0ea5e9;
  --color-info-foreground: #ffffff;

  /* Bordas e inputs */
  --color-border: #9ab4d1;
  --color-input: #e8f0f8;
  --color-ring: #e35915;

  /* ═══════════════════════════════════════════════════════════
     SOMBRAS - "Suave e Acolhedor"
     ═══════════════════════════════════════════════════════════ */

  --shadow-xs: 0 1px 2px rgba(120, 50, 1, 0.04);
  --shadow-sm: 0 2px 4px rgba(120, 50, 1, 0.06);
  --shadow-md: 0 4px 12px rgba(120, 50, 1, 0.08);
  --shadow-lg: 0 8px 24px rgba(120, 50, 1, 0.1);
  --shadow-xl: 0 16px 48px rgba(120, 50, 1, 0.12);

  /* Sombra colorida para CTAs */
  --shadow-primary: 0 4px 14px rgba(227, 89, 21, 0.25);
  --shadow-primary-hover: 0 6px 20px rgba(227, 89, 21, 0.35);
}
```

---

## Tipografia

### Escala Tipográfica

| Token       | Tamanho | Line Height | Uso                        |
| ----------- | ------- | ----------- | -------------------------- |
| `text-xs`   | 12px    | 16px        | Legendas, badges, metadata |
| `text-sm`   | 14px    | 20px        | Texto secundário, labels   |
| `text-base` | 16px    | 24px        | Corpo de texto padrão      |
| `text-lg`   | 18px    | 28px        | Texto destacado            |
| `text-xl`   | 20px    | 28px        | Subtítulos de seção        |
| `text-2xl`  | 24px    | 32px        | Títulos de card            |
| `text-3xl`  | 30px    | 36px        | Títulos de página          |
| `text-4xl`  | 36px    | 40px        | Hero headlines             |
| `text-5xl`  | 48px    | 48px        | Display (site público)     |

### Famílias

```tsx
// Títulos e headlines - Outfit
<h1 style={{ fontFamily: 'var(--font-display)' }}>
  Encontre seu novo melhor amigo
</h1>

// Corpo de texto - DM Sans (padrão)
<p className="font-sans">
  Texto corrido do sistema
</p>
```

### Pesos

| Peso | Tailwind        | Uso                           |
| ---- | --------------- | ----------------------------- |
| 400  | `font-normal`   | Corpo de texto                |
| 500  | `font-medium`   | Labels, links, texto enfático |
| 600  | `font-semibold` | Títulos de cards, botões      |
| 700  | `font-bold`     | Headlines, títulos principais |

### Padrões de Texto

```tsx
// Título de página (Admin)
<h1 className="text-2xl font-bold tracking-tight"
    style={{ fontFamily: 'var(--font-display)' }}>
  Painel Administrativo
</h1>

// Título de seção
<h2 className="text-xl font-semibold">
  Gatos Disponíveis
</h2>

// Título de card
<h3 className="text-lg font-semibold">
  Nome do Gato
</h3>

// Descrição/subtítulo
<p className="text-muted-foreground">
  Texto explicativo secundário
</p>

// Label de formulário
<label className="text-sm font-medium text-foreground">
  E-mail
</label>

// Texto de ajuda
<span className="text-xs text-muted-foreground">
  Mínimo 6 caracteres
</span>
```

---

## Cores

### Paleta Principal

```
┌─────────────────────────────────────────────────────────────────┐
│  AZUL CÉU                MARROM TERRA           LARANJA         │
│  #AEC7E2                 #783201                #E35915         │
│  ████████                ████████               ████████        │
│  Fundo, calma            Texto, âncora          CTA, energia    │
└─────────────────────────────────────────────────────────────────┘
```

### Uso Semântico

| Cor                     | Token              | Quando Usar                                         |
| ----------------------- | ------------------ | --------------------------------------------------- |
| Laranja `#E35915`       | `primary`          | CTAs principais, ações positivas, links importantes |
| Laranja claro `#F07B3D` | `accent`           | Hover states, destaques secundários                 |
| Azul céu `#AEC7E2`      | `background`       | Fundo geral (site público)                          |
| Azul claro `#D4E3F3`    | `secondary`        | Botões secundários, tags                            |
| Branco `#FFFFFF`        | `card`             | Cards, superfícies elevadas                         |
| Marrom `#783201`        | `foreground`       | Texto principal                                     |
| Marrom médio `#8B5A2B`  | `muted-foreground` | Texto secundário                                    |
| Vermelho `#DC2626`      | `destructive`      | Erros, ações destrutivas                            |
| Verde `#16A34A`         | `success`          | Sucesso, confirmações                               |
| Amarelo `#F59E0B`       | `warning`          | Alertas, atenção                                    |

### Contraste e Acessibilidade

| Combinação                   | Ratio | WCAG AA | WCAG AAA |
| ---------------------------- | ----- | ------- | -------- |
| Marrom (#783201) em Branco   | 8.2:1 | ✅      | ✅       |
| Branco em Laranja (#E35915)  | 4.5:1 | ✅      | ❌       |
| Marrom em Azul Céu (#AEC7E2) | 5.1:1 | ✅      | ❌       |
| Marrom médio em Branco       | 5.8:1 | ✅      | ❌       |

---

## Espaçamento

### Escala de Espaçamento

Baseada em múltiplos de 4px para consistência visual.

| Token       | Valor | Uso Comum                   |
| ----------- | ----- | --------------------------- |
| `space-0.5` | 2px   | Ajustes mínimos             |
| `space-1`   | 4px   | Gap entre ícone e texto     |
| `space-1.5` | 6px   | Padding de badges           |
| `space-2`   | 8px   | Gap entre elementos inline  |
| `space-3`   | 12px  | Padding interno pequeno     |
| `space-4`   | 16px  | Padding padrão de cards     |
| `space-5`   | 20px  | Gap entre seções pequenas   |
| `space-6`   | 24px  | Padding de cards            |
| `space-8`   | 32px  | Gap entre seções            |
| `space-10`  | 40px  | Margens de página (mobile)  |
| `space-12`  | 48px  | Separação de seções grandes |
| `space-16`  | 64px  | Padding de hero sections    |

### Padrões de Layout

```tsx
// Card padrão
<Card className="p-6">          {/* 24px interno */}
  <CardHeader className="pb-4"> {/* 16px abaixo do header */}
  <CardContent className="space-y-4"> {/* 16px entre itens */}
</Card>

// Grid de cards
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

// Lista de itens
<ul className="space-y-2">      {/* 8px entre itens */}

// Formulário
<form className="space-y-5">    {/* 20px entre campos */}

// Página admin
<main className="p-4 md:p-6">   {/* 16px mobile, 24px desktop */}

// Seções de página
<section className="space-y-8"> {/* 32px entre seções */}
```

---

## Border Radius

### Filosofia

Bordas **generosamente arredondadas** transmitem acolhimento e suavidade.

### Aplicação por Componente

| Componente       | Radius | Token                     |
| ---------------- | ------ | ------------------------- |
| Badges, chips    | 6px    | `rounded` ou `rounded-md` |
| Inputs, selects  | 8px    | `rounded-lg`              |
| Botões           | 8-12px | `rounded-lg`              |
| Cards internos   | 12px   | `rounded-xl`              |
| Cards principais | 16px   | `rounded-2xl`             |
| Modais, sheets   | 20px   | `rounded-2xl`             |
| Cards hero       | 24px   | `rounded-3xl`             |
| Avatares, pills  | full   | `rounded-full`            |

### Exemplos

```tsx
// Botão padrão
<Button className="rounded-lg">

// Card de gato (site público)
<Card className="rounded-2xl overflow-hidden">

// Card admin
<Card className="rounded-xl">

// Input
<Input className="rounded-lg">

// Avatar
<Avatar className="rounded-full">

// Badge
<Badge className="rounded-md">
```

---

## Sombras

### Hierarquia de Elevação

```
┌─────────────────────────────────────────────────────────────────┐
│  Nível 0: Sem sombra      - Elementos inline, texto             │
│  Nível 1: shadow-sm       - Inputs em foco, cards sutis         │
│  Nível 2: shadow-md       - Cards padrão, dropdowns             │
│  Nível 3: shadow-lg       - Cards em hover, modais              │
│  Nível 4: shadow-xl       - Popovers, overlays                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sombras com Cor

Para CTAs e elementos destacados, usar sombra colorida:

```tsx
// Botão primário
<Button className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35">
  Quero Adotar
</Button>

// Card em destaque
<Card className="shadow-xl shadow-primary/10">
```

### Exemplos Práticos

```tsx
// Card padrão
<Card className="shadow-sm hover:shadow-lg transition-shadow">

// Card de gato (hover interativo)
<Card className="shadow-md hover:shadow-xl hover:shadow-primary/5
                 transition-all duration-200">

// Modal/Dialog
<DialogContent className="shadow-2xl">

// Dropdown menu
<DropdownMenuContent className="shadow-lg">

// Input em foco
<Input className="focus:shadow-sm focus:shadow-ring/20">
```

---

## Animações

### Princípios

- **Sutis e propositais** - nunca distraem do conteúdo
- **Rápidas** - 150-300ms para micro-interações
- **Suaves** - easing natural (ease-out para entrada, ease-in para saída)

### Durações

| Tipo  | Duração | Uso                                    |
| ----- | ------- | -------------------------------------- |
| Micro | 150ms   | Hover em botões, foco                  |
| Curta | 200ms   | Mudança de estados, toggles            |
| Média | 300ms   | Transições de cards, expand/collapse   |
| Longa | 500ms   | Entrada de modais, animações de página |

### Animações Definidas

```css
/* Fade in com movimento para cima */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Float suave (para ilustrações) */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Pulse suave (para loading, destaque) */
@keyframes pulse-soft {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

### Classes Utilitárias

```tsx
// Entrada com stagger
<div className="animate-fade-in-up">
<div className="animate-fade-in-up animation-delay-100">
<div className="animate-fade-in-up animation-delay-200">

// Ilustração flutuante (site público)
<img className="animate-float" />

// Loading state
<div className="animate-pulse-soft">
```

### Transições de Componentes

```tsx
// Botão com hover suave
<Button className="transition-all duration-200
                   hover:scale-[1.02] active:scale-[0.98]">

// Card interativo
<Card className="transition-all duration-200
                 hover:shadow-lg hover:-translate-y-0.5">

// Link com underline animado
<a className="relative after:absolute after:bottom-0 after:left-0
              after:h-0.5 after:w-0 after:bg-primary
              after:transition-all hover:after:w-full">
```

---

## Componentes

### Estados Globais

Todos os componentes interativos devem ter estes estados:

| Estado             | Visual                                |
| ------------------ | ------------------------------------- |
| **Default**        | Aparência base                        |
| **Hover**          | Leve elevação, cor mais intensa       |
| **Focus**          | Ring de foco visível (acessibilidade) |
| **Active/Pressed** | Leve escala para baixo (0.98)         |
| **Disabled**       | Opacidade 50%, cursor not-allowed     |
| **Loading**        | Spinner, texto "Carregando..."        |

### Button

```tsx
// Variantes
<Button variant="default">   {/* Laranja, CTA principal */}
<Button variant="secondary"> {/* Azul claro, ação secundária */}
<Button variant="outline">   {/* Borda, ação terciária */}
<Button variant="ghost">     {/* Sem fundo, ações sutis */}
<Button variant="destructive"> {/* Vermelho, ações destrutivas */}
<Button variant="link">      {/* Apenas texto, navegação */}

// Tamanhos
<Button size="sm">   {/* h-9, texto menor */}
<Button size="default"> {/* h-10 */}
<Button size="lg">   {/* h-11, padding maior */}
<Button size="icon"> {/* Quadrado, apenas ícone */}

// Com estados
<Button disabled>Desabilitado</Button>
<Button className="gap-2">
  <Loader2 className="animate-spin" />
  Salvando...
</Button>
```

### Card

```tsx
// Card básico
<Card className="rounded-xl shadow-sm">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
  <CardFooter>Ações</CardFooter>
</Card>

// Card interativo (link)
<Card className="cursor-pointer rounded-xl shadow-sm
                 transition-all duration-200
                 hover:shadow-lg hover:-translate-y-0.5
                 hover:border-primary/20">

// Card destacado
<Card className="rounded-2xl shadow-lg border-2 border-primary/20">
```

### Input

```tsx
// Input padrão
<Input
  className="h-11 rounded-lg bg-white/80
             border-border/60
             transition-colors
             focus:bg-white focus:border-primary"
/>

// Input com ícone
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                   h-4 w-4 text-muted-foreground" />
  <Input className="pl-10" />
</div>

// Input com erro
<Input className="border-destructive focus:ring-destructive" />
<p className="text-sm text-destructive mt-1">Mensagem de erro</p>

// Textarea padrão (Admin)
<Textarea
  className="min-h-[80px] rounded-lg border border-border/60 bg-card
             transition-colors focus:border-primary focus:ring-2
             focus:ring-primary/20"
/>

// ⚠️ Evitar em telas admin:
// bg-background no textarea (pode herdar fundo azul do tema)
```

### Badge/Tag

```tsx
// Status badges
<Badge variant="default">Disponível</Badge>    {/* Laranja */}
<Badge variant="secondary">Em processo</Badge> {/* Azul */}
<Badge variant="outline">Adotado</Badge>       {/* Borda */}
<Badge variant="destructive">Urgente</Badge>   {/* Vermelho */}

// Badge de saúde (gatos)
<Badge className="bg-success/10 text-success border-success/20">
  Vacinado
</Badge>
```

### Avatar

```tsx
<Avatar className="h-10 w-10 border border-border">
  <AvatarImage src={user.image} />
  <AvatarFallback className="bg-primary/10 text-primary font-medium">
    {getInitials(user.name)}
  </AvatarFallback>
</Avatar>
```

### ConfirmDialog

Componente unificado para todas as modais de confirmação e ação.
Localização:: `@/components/ui/confirm-dialog`.

```
┌──────────────────────────────────────┐
│  [zona colorida]  [ícone]  [título]  │  ← faixa contextual (cor por variant)
│                         [subtítulo]  │
├──────────────────────────────────────┤
│  Descrição direta                    │  ← corpo: texto + nota opcional
│  ┌────────────────────────────────┐  │
│  │  nota contextual (bg-muted/30) │  │
│  └────────────────────────────────┘  │
│  [children — formulário opcional]    │
├──────────────────────────────────────┤
│  [Cancelar]              [Ação]      │  ← footer com bg-card + borda
└──────────────────────────────────────┘
```

#### Props

| Prop                 | Tipo                                                | Descrição                                                  |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `mode`               | `'alert' \| 'dialog'`                               | `alert` não fecha ao clicar fora (padrão). `dialog` fecha. |
| `variant`            | `'destructive' \| 'success' \| 'warning' \| 'info'` | Cor da faixa e do botão de ação                            |
| `icon`               | `LucideIcon`                                        | Ícone exibido na faixa colorida                            |
| `title`              | `string`                                            | Título principal                                           |
| `subtitle`           | `string` (opcional)                                 | Subtítulo abaixo do título, na faixa                       |
| `description`        | `ReactNode` (opcional)                              | Descrição no corpo                                         |
| `note`               | `ReactNode` (opcional)                              | Nota contextual em card `muted/30`                         |
| `children`           | `ReactNode` (opcional)                              | Formulário ou conteúdo adicional                           |
| `actionLabel`        | `string`                                            | Texto do botão de ação                                     |
| `actionLoadingLabel` | `string` (opcional)                                 | Texto durante loading                                      |
| `isLoading`          | `boolean`                                           | Estado de carregamento                                     |
| `isActionDisabled`   | `boolean`                                           | Desabilita o botão de ação                                 |
| `cancelLabel`        | `string`                                            | Texto do botão cancelar (padrão: "Cancelar")               |
| `onAction`           | `() => void`                                        | Callback do botão de ação                                  |

#### Variant por tipo de ação

| Variant       | Cor      | Quando usar                             | Ícones sugeridos             |
| ------------- | -------- | --------------------------------------- | ---------------------------- |
| `destructive` | Vermelho | Ação irreversível, perda de acesso      | `AlertTriangle`, `Trash2`    |
| `success`     | Verde    | Confirmação positiva, reativação        | `UserCheck2`, `CheckCircle2` |
| `warning`     | Âmbar    | Ação com consequência moderada          | `MailX`, `AlertCircle`       |
| `info`        | Azul     | Formulário neutro, alteração reversível | `ShieldCheck`, `Info`        |

#### Quando usar cada mode

| Mode             | Fecha ao clicar fora? | Quando usar                        |
| ---------------- | --------------------- | ---------------------------------- |
| `alert` (padrão) | Não                   | Ações destrutivas ou irreversíveis |
| `dialog`         | Sim                   | Formulários e ações reversíveis    |

#### Exemplos

```tsx
// Ação destrutiva (mode alert, padrão)
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  variant="destructive"
  icon={AlertTriangle}
  title="Desativar usuário"
  description={
    <>
      <strong className="text-foreground">{user.name}</strong> perderá o acesso
      ao sistema imediatamente.
    </>
  }
  actionLabel="Desativar"
  actionLoadingLabel="Desativando..."
  isLoading={mutation.isPending}
  onAction={() => mutation.mutate({ userId: user.id })}
/>

// Com nota contextual
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  variant="success"
  icon={UserCheck2}
  title="Reativar acesso"
  description="Restaura o acesso imediatamente, sem novo convite."
  note="A pessoa poderá fazer login com a senha anterior."
  actionLabel="Reativar acesso"
  actionLoadingLabel="Reativando..."
  isLoading={mutation.isPending}
  onAction={() => mutation.mutate({ userId })}
/>

// Com formulário (mode dialog — fecha ao clicar fora)
<ConfirmDialog
  mode="dialog"
  open={open}
  onOpenChange={setOpen}
  variant="info"
  icon={ShieldCheck}
  title="Alterar papel"
  subtitle={user.name}
  actionLabel="Salvar"
  actionLoadingLabel="Salvando..."
  isLoading={mutation.isPending}
  isActionDisabled={selectedRole === user.role}
  onAction={handleSave}
>
  {/* Formulário vai aqui como children */}
  <Select value={selectedRole} onValueChange={setSelectedRole}>
    ...
  </Select>
</ConfirmDialog>
```

### Pagination (BasePagination)

Componente unificado de paginação com variantes para Admin e Público.
Localização: `@/components/base-pagination`.

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [← Anterior]  [1] [2] [3] ... [10]  [Próxima →]           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Container: card com border-border/60, bg-card/95, shadow-warm-sm│
│  Mobile: "X de Y" simplificado                                   │
├─────────────────────────────────────────────────────────────────┤
│                         PÚBLICO                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [← Anterior]  [1] [2] [●3] ... [10]  [Próxima →]          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Container: rounded-2xl, bg-white/70, backdrop-blur-sm          │
│  Página ativa: gradiente from-primary to-accent                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Props

| Prop           | Tipo                     | Descrição                         |
| -------------- | ------------------------ | --------------------------------- |
| `page`         | `number`                 | Página atual                      |
| `totalPages`   | `number`                 | Total de páginas                  |
| `onPageChange` | `(page: number) => void` | Callback de mudança de página     |
| `variant`      | `'admin' \| 'public'`    | Estilo visual (padrão: `'admin'`) |
| `className`    | `string` (opcional)      | Classes adicionais                |

#### Comportamento

- Retorna `null` se `totalPages <= 1`
- Mostra ellipsis (`...`) quando há muitas páginas
- Mobile: exibe apenas "X de Y" com botões prev/next
- Desktop: exibe números de página com navegação completa

#### Uso no Admin

**Importante:** No admin, a paginação deve estar dentro de um card wrapper.

```tsx
import { BasePagination } from '@/components/base-pagination'

// ✅ Correto - com card wrapper
;<div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-2">
  <CatsPagination
    page={data.pagination.page}
    totalPages={data.pagination.totalPages}
    onPageChange={onPageChange}
  />
</div>

// Wrapper reutilizável (thin wrapper)
// apps/web/src/app/[slug]/admin/gatos/_components/cats-pagination.tsx
export function CatsPagination(props: CatsPaginationProps) {
  return <BasePagination {...props} />
}
```

#### Uso no Público

```tsx
// O variant="public" já inclui o container estilizado
;<PublicCatsPagination
  page={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>

// Wrapper (thin wrapper)
// apps/web/src/app/[slug]/(public)/_components/public-cats-pagination.tsx
export function PublicCatsPagination(props: Props) {
  return <BasePagination {...props} variant="public" />
}
```

#### Estilos por Variante

| Aspecto          | Admin                                    | Public                                                      |
| ---------------- | ---------------------------------------- | ----------------------------------------------------------- |
| Container        | Card externo (wrapper)                   | Interno: `rounded-2xl bg-white/70 backdrop-blur-sm`         |
| Página ativa     | `buttonVariants({ variant: 'default' })` | `bg-gradient-to-r from-primary to-accent shadow-primary/25` |
| Página inativa   | `buttonVariants({ variant: 'outline' })` | `text-foreground hover:bg-muted/40 hover:text-primary`      |
| Botões prev/next | Componentes UI base                      | Custom com `text-foreground`                                |
| Desabilitado     | `opacity-50 pointer-events-none`         | `text-muted-foreground/30 cursor-not-allowed`               |

---

## Guidelines: Site Público vs Admin

### Site Público

**Objetivo:** Emocionar e conectar pessoas aos animais

| Aspecto         | Diretriz                                                |
| --------------- | ------------------------------------------------------- |
| **Fundo**       | Usar `background` (azul céu) como fundo principal       |
| **Cards**       | Mais arredondados (`rounded-2xl`), sombras pronunciadas |
| **Tipografia**  | Usar `font-display` (Outfit) para headlines             |
| **Ilustrações** | Permitido elementos temáticos de gatos/pets             |
| **Animações**   | Mais expressivas, entrada com stagger                   |
| **Espaçamento** | Mais generoso, respiro visual                           |
| **Imagens**     | Destaque, carrossel de fotos do gato                    |

```tsx
// Hero do site público
<section className="min-h-screen bg-background p-8">
  <div className="max-w-6xl mx-auto">
    <h1 className="text-5xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}>
      Encontre seu novo
      <span className="text-primary"> melhor amigo</span>
    </h1>

    {/* Ilustração flutuante */}
    <div className="animate-float">
      <Cat className="w-20 h-20 text-primary" />
    </div>
  </div>
</section>

// Card de gato (público)
<Card className="rounded-2xl overflow-hidden shadow-lg
                 hover:shadow-xl transition-all group">
  <div className="aspect-square overflow-hidden">
    <img className="object-cover w-full h-full
                    group-hover:scale-105 transition-transform duration-300" />
  </div>
  <CardContent className="p-5">
    <h3 className="text-xl font-semibold">{cat.name}</h3>
    <p className="text-muted-foreground">{cat.description}</p>
  </CardContent>
</Card>
```

### Painel Admin

**Objetivo:** Produtividade e eficiência operacional

| Aspecto         | Diretriz                                    |
| --------------- | ------------------------------------------- |
| **Fundo**       | Cards brancos sobre fundo neutro            |
| **Cards**       | Arredondamento moderado (`rounded-xl`)      |
| **Tipografia**  | `font-display` apenas para título da página |
| **Ilustrações** | Evitar elementos temáticos, manter neutro   |
| **Animações**   | Mais sutis, focadas em feedback             |
| **Espaçamento** | Compacto mas respirável                     |
| **Tabelas**     | Foco em dados e ações                       |

```tsx
// Layout admin
<div className="flex min-h-screen bg-background">
  <Sidebar />
  <div className="flex-1 flex flex-col">
    <Header />
    <main className="flex-1 p-4 md:p-6 overflow-auto">
      {children}
    </main>
  </div>
</div>

// Título de página (admin)
<div className="space-y-1">
  <h1 className="text-2xl font-bold tracking-tight"
      style={{ fontFamily: 'var(--font-display)' }}>
    Gatos
  </h1>
  <p className="text-muted-foreground">
    Gerencie os gatos disponíveis para adoção
  </p>
</div>

// Card admin
<Card className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg">Resumo</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Conteúdo funcional */}
  </CardContent>
</Card>

// Tabela admin
<Table>
  <TableHeader>
    <TableRow className="hover:bg-transparent">
      <TableHead>Nome</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-muted/50">
      {/* ... */}
    </TableRow>
  </TableBody>
</Table>
```

### Padrões Consolidados (CRUD de Gatos)

Estes padrões foram consolidados nas telas de **cadastro** e **listagem** de gatos e devem ser reutilizados em novos fluxos administrativos.

#### 1) Formulário de Cadastro (alta frequência)

- Container centralizado com largura máxima: `max-w-6xl`
- Cards compactos e consistentes: `rounded-xl border-border/60 bg-card/95 shadow-warm-sm`
- Fotos no topo em faixa horizontal compacta (com contador e drag-and-drop)
- Layout desktop em 2 colunas:
  - Esquerda: informações básicas + descrição
  - Direita: saúde
- Densidade de campos:
  - Inputs principais: `h-10`
  - Toggles/segmentos: `h-8`
  - Notas condicionais: `h-8`
- CTA sticky no mobile e alinhada à direita no desktop
- Títulos de seção com ícone Lucide `h-4 w-4` + `text-display`
- Tela de sucesso com card destacado e duas ações claras: `Cadastrar outro` e `Ver lista`

```tsx
<div className="mx-auto w-full max-w-6xl space-y-4">
  <Card className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm" />
  <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
    <Card className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm" />
    <Card className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm" />
  </div>
</div>
```

#### 2) Listagem de Gatos (operação diária)

- Header no mesmo tom visual do formulário (`max-w-6xl`, título com ícone, CTA com glow)
- Barra de filtros em card compacto:
  - Status
  - Busca por nome
  - Botão de filtros avançados com badge de quantidade
- Estrutura de resultado em blocos:
  - Card de resumo (`N gatos encontrados`)
  - Card da tabela
  - Card da paginação
- Tabela com ações sticky à direita e linha expansível para detalhes de saúde/cuidados
- Estados `loading`, `empty` e `error` com o mesmo shape visual da tela principal
- Drawer de filtros avançados seguindo o mesmo padrão de radius/sombra/botões

```tsx
<div className="flex min-h-0 flex-1 flex-col gap-3">
  <div className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm" />
  <div className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm" />
  <div className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm" />
</div>
```

#### 3) Microcopy e linguagem (PT-BR)

- Sempre usar acentuação correta em labels, mensagens e placeholders
- Preferir textos curtos e acionáveis para operações de alta frequência
- Padrão recomendado:
  - Título + subtítulo de contexto
  - Label objetiva
  - Placeholder exemplificando formato (`Ex.: ...`)

### Comparativo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                      SITE PÚBLICO                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🐱  Encontre seu novo melhor amigo                      │   │
│  │      ══════════════════════════════                      │   │
│  │                                                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │   │
│  │  │  foto   │  │  foto   │  │  foto   │  ← Cards 2xl     │   │
│  │  │         │  │         │  │         │                  │   │
│  │  │  Mimi   │  │  Felix  │  │  Luna   │                  │   │
│  │  └─────────┘  └─────────┘  └─────────┘                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Fundo azul céu • Cards arredondados • Ilustrações • Emocional  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PAINEL ADMIN                                │
│  ┌────────┬─────────────────────────────────────────────────┐   │
│  │        │  Header                              [Avatar ▼] │   │
│  │  Side  ├─────────────────────────────────────────────────┤   │
│  │  bar   │  Gatos                                          │   │
│  │        │  ──────                                         │   │
│  │  🐱    │  ┌─────────────────────────────────────────┐   │   │
│  │  Gatos │  │ Nome     Status      Ações             │   │   │
│  │        │  ├─────────────────────────────────────────┤   │   │
│  │  ❤️    │  │ Mimi     Disponível  [Editar] [Ver]    │   │   │
│  │  Adot. │  │ Felix    Em processo [Editar] [Ver]    │   │   │
│  │        │  └─────────────────────────────────────────┘   │   │
│  └────────┴─────────────────────────────────────────────────┘   │
│                                                                  │
│  Fundo neutro • Cards clean • Tabelas • Funcional               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Acessibilidade

### Requisitos WCAG 2.1 AA

| Critério                  | Implementação                                         |
| ------------------------- | ----------------------------------------------------- |
| **Contraste de texto**    | Mínimo 4.5:1 para texto normal, 3:1 para texto grande |
| **Foco visível**          | Ring de foco em todos os elementos interativos        |
| **Navegação por teclado** | Todos os elementos acessíveis via Tab                 |
| **Labels**                | Todos os inputs com labels associados                 |
| **Alt text**              | Todas as imagens com descrição                        |
| **Hierarquia**            | Headings em ordem lógica (h1 > h2 > h3)               |

### Focus States

```tsx
// Focus ring padrão (definido globalmente)
* {
  @apply outline-ring/50;
}

// Focus visible para elementos interativos
<Button className="focus-visible:outline-none
                   focus-visible:ring-2
                   focus-visible:ring-ring
                   focus-visible:ring-offset-2">

// Input focus
<Input className="focus:ring-2 focus:ring-ring focus:ring-offset-2">
```

### Cores e Contraste

```tsx
// ✅ Bom contraste
<p className="text-foreground">Texto principal</p>           // 8.2:1
<p className="text-muted-foreground">Texto secundário</p>    // 5.8:1

// ❌ Evitar
<p className="text-muted-foreground/50">Muito claro</p>      // < 4.5:1
```

### Aria Labels

```tsx
// Botões com ícone apenas
<Button size="icon" aria-label="Fechar menu">
  <X className="h-4 w-4" />
</Button>

// Links externos
<a href="..." target="_blank" rel="noopener noreferrer"
   aria-label="WhatsApp (abre em nova aba)">

// Status visual
<Badge aria-label="Status: Disponível para adoção">
  Disponível
</Badge>
```

---

## Ícones

### Biblioteca

Usar **Lucide React** como biblioteca padrão de ícones.

```tsx
import { Cat, Heart, Home, Users, FileText } from 'lucide-react'
```

### Tamanhos Padrão

| Contexto         | Tamanho | Classe                   |
| ---------------- | ------- | ------------------------ |
| Inline com texto | 16px    | `h-4 w-4`                |
| Botões           | 16-20px | `h-4 w-4` ou `h-5 w-5`   |
| Cards/Features   | 20-24px | `h-5 w-5` ou `h-6 w-6`   |
| Hero/Destaque    | 32-48px | `h-8 w-8` ou `h-12 w-12` |

### Ícones Temáticos (Site Público)

Permitidos apenas no site público:

| Ícone      | Uso                                 |
| ---------- | ----------------------------------- |
| `Cat`      | Representação de gatos, ilustrações |
| `Heart`    | Favoritos, adoção, amor             |
| `Home`     | Lar, acolhimento                    |
| `PawPrint` | Elementos decorativos               |

### Ícones Funcionais (Admin)

| Ícone                          | Uso                               |
| ------------------------------ | --------------------------------- |
| `Plus`                         | Adicionar novo                    |
| `Pencil`                       | Editar                            |
| `Trash2`                       | Excluir                           |
| `Eye`                          | Visualizar                        |
| `Search`                       | Buscar                            |
| `Filter` / `SlidersHorizontal` | Filtros                           |
| `Download`                     | Exportar                          |
| `Upload`                       | Importar                          |
| `ChevronDown`                  | Expandir                          |
| `MoreVertical`                 | Menu de ações                     |
| `PawPrint`                     | Seção de identificação / contagem |
| `HeartPulse`                   | Seção de saúde                    |
| `FileText`                     | Seção de descrição                |
| `Images`                       | Seção de fotos                    |
| `Clock3`                       | Coluna de idade                   |
| `ShieldCheck`                  | Coluna de status                  |
| `CheckCircle2`                 | Confirmação de sucesso            |

---

## Checklist de Implementação

### Novo Componente

- [ ] Usa tokens de cor do design system
- [ ] Border radius apropriado para o contexto
- [ ] Sombra adequada ao nível de elevação
- [ ] Estados hover, focus, active, disabled
- [ ] Transições suaves (200ms)
- [ ] Acessível via teclado
- [ ] Contraste de cores adequado

### Nova Página (Admin)

- [ ] Título com `font-display`
- [ ] Descrição em `text-muted-foreground`
- [ ] Container centralizado com `max-w-6xl` (quando aplicável)
- [ ] Espaçamento compacto e consistente (`gap-3` a `gap-4` para operações frequentes)
- [ ] Cards com `rounded-xl`, `border-border/60`, `bg-card/95` e `shadow-warm-sm`
- [ ] Estados `loading`, `empty` e `error` com o mesmo padrão visual da tela final
- [ ] Microcopy em PT-BR com acentuação correta
- [ ] Breadcrumb se necessário
- [ ] Loading states

### Nova Página (Público)

- [ ] Fundo `bg-background` (azul céu)
- [ ] Cards com `rounded-2xl` e sombras pronunciadas
- [ ] Animações de entrada
- [ ] Headlines com `font-display`
- [ ] CTAs com sombra colorida
- [ ] Responsive (mobile-first)

---

## Recursos

### Fontes (Google Fonts)

```html
<!-- DM Sans -->
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
  rel="stylesheet"
/>

<!-- Outfit -->
<link
  href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
  rel="stylesheet"
/>
```

### Dependências

```json
{
  "lucide-react": "^0.x",
  "class-variance-authority": "^0.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

---

_PetLar Design System v1.2 - Atualizado em Fevereiro/2026_
