# Plano de Desenvolvimento - MVP Sistema de Adoção de Gatos

## 1. Visão Geral

### Objetivo
Sistema para gestão de adoção de gatos para ONGs, com site público para candidaturas e painel administrativo para gerenciamento.

### Estratégia
1. **Fase 1 (MVP):** Implementar para uma ONG específica, validar com usuários reais
2. **Fase 2:** Escalar para SaaS multi-tenant

### Stack Tecnológica
- **Framework:** Next.js 15+ (App Router, fullstack)
- **API:** tRPC
- **Banco de dados:** SQLite via Turso (multi-tenant, um banco para todas as ONGs)
- **ORM:** Drizzle
- **Autenticação:** Better Auth
- **Email:** Resend
- **Storage:** Cloudflare R2 (fotos e vídeos)

---

## 2. Arquitetura Multi-tenant

### Estratégia de Isolamento
- Coluna `org_id` em todas as tabelas que pertencem a uma ONG
- Filtros automáticos no Drizzle para garantir isolamento
- Subdomínio ou slug por ONG para fase SaaS: `onggatinhos.seuapp.com`

### Tabelas Globais (sem org_id)
- `orgs`

### Tabelas por ONG (com org_id)
- Todas as demais

---

## 3. Estrutura do Banco de Dados

### 3.1 Organizações

```sql
orgs {
  id: text (uuid) PK
  name: text
  slug: text UNIQUE -- para URL
  logo_url: text?
  created_at: timestamp
  updated_at: timestamp
}
```

### 3.2 Usuários e Autenticação

```sql
users {
  id: text (uuid) PK
  org_id: text FK -> orgs.id
  email: text UNIQUE
  name: text
  password_hash: text
  role: enum('admin', 'voluntario')
  active: boolean DEFAULT true
  last_login_at: timestamp?
  created_at: timestamp
  updated_at: timestamp
}

invites {
  id: text (uuid) PK
  org_id: text FK -> orgs.id
  email: text
  role: enum('admin', 'voluntario')
  token: text UNIQUE
  expires_at: timestamp -- 48h após criação
  used_at: timestamp?
  invited_by: text FK -> users.id
  created_at: timestamp
}

sessions {
  -- Gerenciado pelo Better Auth
}
```

### 3.3 Formulários Dinâmicos

```sql
forms {
  id: text (uuid) PK
  org_id: text FK -> orgs.id
  name: text -- ex: "Gato de apartamento", "Gato de rua"
  description: text?
  active: boolean DEFAULT true
  created_at: timestamp
  updated_at: timestamp
}

form_fields {
  id: text (uuid) PK
  form_id: text FK -> forms.id
  order: integer -- ordem de exibição
  type: enum('text', 'textarea', 'number', 'select', 'multiselect', 'boolean', 'date', 'media')
  label: text
  placeholder: text?
  required: boolean DEFAULT false
  filterable: boolean DEFAULT false -- se aparece nos filtros de interessados
  options: json? -- para select/multiselect: ["Apartamento", "Casa", "Sítio"]

  -- Configuração de mídia
  media_config: json? -- { "tipo": "foto" | "video", "maxDuracao": 30, "maxTamanho": 50 }

  -- Campo condicional
  condition: json? -- { "fieldId": "xxx", "operator": "igual" | "diferente", "value": "xxx" }

  created_at: timestamp
  updated_at: timestamp
}
```

### 3.4 Gatos

```sql
cats {
  id: text (uuid) PK
  org_id: text FK -> orgs.id
  form_id: text FK -> forms.id -- formulário usado para candidaturas

  -- Dados básicos
  name: text
  age_years: integer?
  age_months: integer?
  sex: enum('macho', 'femea')

  -- Saúde
  fiv: enum('positivo', 'negativo', 'nao_testado')
  felv: enum('positivo', 'negativo', 'nao_testado')
  castrated: boolean
  vaccinated: boolean
  vaccination_notes: text? -- detalhes das vacinas
  dewormed: boolean
  deworming_notes: text?

  -- Descrição
  description: text -- personalidade, história, etc

  -- Status
  status: enum('disponivel', 'em_processo', 'adotado') DEFAULT 'disponivel'

  created_by: text FK -> users.id
  created_at: timestamp
  updated_at: timestamp
}

cat_photos {
  id: text (uuid) PK
  cat_id: text FK -> cats.id
  url: text -- URL do R2
  order: integer -- 1, 2 ou 3
  created_at: timestamp
}
```

### 3.5 Candidaturas

```sql
applications {
  id: text (uuid) PK
  org_id: text FK -> orgs.id
  cat_id: text FK -> cats.id

  -- Dados do candidato (campos fixos)
  applicant_name: text
  applicant_email: text
  applicant_phone: text -- WhatsApp

  -- Respostas do formulário dinâmico
  responses: json -- { "fieldId": "valor", ... }

  -- Confirmação
  confirmation_code: text
  confirmed_at: timestamp?

  -- Status de análise
  status: enum('novo', 'em_analise', 'aprovado', 'rejeitado') DEFAULT 'novo'
  status_changed_at: timestamp?
  status_changed_by: text? FK -> users.id
  rejection_reason: text?

  created_at: timestamp
  updated_at: timestamp
}

-- Arquivos enviados nas candidaturas (fotos/vídeos)
application_files {
  id: text (uuid) PK
  application_id: text FK -> applications.id
  field_id: text FK -> form_fields.id
  url: text -- URL do R2
  file_type: enum('foto', 'video')
  created_at: timestamp
}
```

### 3.6 Adoções

```sql
adoptions {
  id: text (uuid) PK
  org_id: text FK -> orgs.id
  cat_id: text FK -> cats.id
  application_id: text? FK -> applications.id -- pode ser null se adoção direta

  -- Dados do adotante
  adopter_name: text
  adopter_phone: text
  adopter_email: text?

  -- Adoção
  adoption_date: date
  adoption_term_url: text? -- PDF do termo no R2

  notes: text?
  created_by: text FK -> users.id
  created_at: timestamp
}
```

---

## 4. Fluxos do Sistema

### 4.1 Fluxo Público - Candidatura

```
1. Usuário acessa site público
2. Vê grid de gatos disponíveis (status = 'disponivel')
3. Pode filtrar por: sexo, idade, FIV/FeLV, castrado
4. Clica em um gato → abre modal com detalhes
5. Clica "Quero adotar" → abre modal com formulário
6. Formulário exibe:
   - Campos fixos: nome, email, WhatsApp
   - Campos dinâmicos do formulário vinculado ao gato
   - Campos condicionais aparecem/somem conforme respostas
7. Envia candidatura
8. Sistema gera código de 6 dígitos
9. Email enviado via Resend com código
10. Usuário insere código para confirmar
11. Candidatura salva com confirmed_at preenchido
```

### 4.2 Fluxo Admin - Gestão de Gatos

```
1. Login no painel admin
2. Tela "Gatos" lista todos os gatos da ONG
3. Filtros: status, sexo, FIV/FeLV, formulário
4. Ações por gato:
   - Editar
   - Duplicar (abre form preenchido, edita o que quiser)
   - Ver interessados
   - Marcar como adotado (se em_processo)
   - Excluir
5. Botão "Novo gato":
   - Preenche dados
   - Seleciona formulário
   - Upload de 1-3 fotos
   - Salva
```

### 4.3 Fluxo Admin - Análise de Interessados

```
1. Na lista de gatos, clica "Ver interessados" em um gato
2. Abre tela com lista de candidaturas daquele gato
3. Filtros dinâmicos baseados nos campos filtráveis do formulário:
   - Cada campo filtrável vira um filtro
   - Operadores: igual, diferente, contém (text), maior/menor (number)
4. Filtro fixo por status: novo, em_análise, aprovado, rejeitado
5. Para cada candidato:
   - Ver todas as respostas
   - Ver arquivos enviados (fotos/vídeos)
   - Botão WhatsApp (abre wa.me/numero)
   - Alterar status
6. Ao aprovar alguém e confirmar adoção:
   - Gato muda para status 'em_processo'
   - Quando finalizar, marca como adotado
```

### 4.4 Fluxo Admin - Finalizar Adoção

```
1. No gato com status 'em_processo', clica "Marcar como adotado"
2. Modal abre com:
   - Dropdown de candidatos aprovados (pré-seleciona se só tiver 1)
   - Ou campos manuais: nome, WhatsApp, email
   - Data da adoção
   - Upload do termo de adoção (PDF)
3. Ao salvar:
   - Cria registro em 'adoptions'
   - Gato muda status para 'adotado'
   - Gato some do site público
   - Outros candidatos ficam com status inalterado (histórico)
```

### 4.5 Fluxo Admin - Convite de Usuários

```
1. Admin acessa "Configurações" > "Usuários"
2. Vê lista de usuários ativos e convites pendentes
3. Clica "Convidar usuário"
4. Preenche email e seleciona role (admin/voluntário)
5. Sistema:
   - Cria registro em 'invites' com token e expiração 48h
   - Envia email via Resend com link
6. Convidado clica no link
7. Tela de aceitar convite:
   - Mostra nome da ONG
   - Preenche nome e senha
8. Conta criada, convite marcado como usado
9. Regra: sempre deve existir pelo menos 1 admin ativo
```

---

## 5. Telas do Sistema

### 5.1 Site Público

| Tela | Descrição |
|------|-----------|
| Home | Grid de gatos disponíveis com filtros básicos |
| Modal Detalhes | Fotos, informações completas do gato |
| Modal Candidatura | Formulário dinâmico + confirmação por código |

### 5.2 Painel Admin

| Tela | Descrição | Permissão |
|------|-----------|-----------|
| Login | Email + senha | Público |
| Aceitar Convite | Criar conta via convite | Público (com token) |
| Dashboard | Métricas e resumo | Todos |
| Gatos | CRUD de gatos, filtros, ações | Todos |
| Gato - Interessados | Lista de candidaturas com filtros dinâmicos | Todos |
| Gatos Adotados | Lista de adoções com dados e termos | Todos |
| Formulários | CRUD de formulários dinâmicos | Admin |
| Formulário - Editor | Criar/editar campos do formulário | Admin |
| Usuários | Gerenciar usuários e convites | Admin |

---

## 6. Sistema de Formulários Dinâmicos

### 6.1 Tipos de Campo

| Tipo | Descrição | Filtrável | Operadores de Filtro |
|------|-----------|-----------|---------------------|
| text | Texto curto | Sim | contém, igual |
| textarea | Texto longo | Não | - |
| number | Número | Sim | igual, maior que, menor que |
| select | Seleção única | Sim | igual, diferente |
| multiselect | Seleção múltipla | Sim | contém |
| boolean | Sim/Não | Sim | igual |
| date | Data | Sim | igual, antes de, depois de |
| media | Foto ou vídeo | Não | - |

### 6.2 Estrutura de um Campo (JSON)

```json
{
  "id": "uuid",
  "type": "select",
  "label": "Tipo de moradia",
  "placeholder": "Selecione...",
  "required": true,
  "filterable": true,
  "options": ["Apartamento", "Casa", "Sítio/Chácara"],
  "condition": null
}
```

### 6.3 Campo Condicional

```json
{
  "id": "uuid",
  "type": "boolean",
  "label": "O apartamento é telado?",
  "required": true,
  "filterable": true,
  "condition": {
    "fieldId": "id-do-campo-moradia",
    "operator": "igual",
    "value": "Apartamento"
  }
}
```

### 6.4 Campo de Mídia com Condição

```json
{
  "id": "uuid",
  "type": "media",
  "label": "Envie um vídeo mostrando as telas",
  "required": true,
  "filterable": false,
  "mediaConfig": {
    "tipo": "video",
    "maxDuracao": 30,
    "maxTamanho": 50
  },
  "condition": {
    "fieldId": "id-do-campo-telado",
    "operator": "igual",
    "value": true
  }
}
```

### 6.5 Armazenamento das Respostas

As respostas são salvas em JSON na coluna `applications.responses`:

```json
{
  "campo-moradia-id": "Apartamento",
  "campo-telado-id": true,
  "campo-outros-animais-id": "Sim, 2 gatos",
  "campo-experiencia-id": "Já tive gatos por 10 anos..."
}
```

Arquivos de mídia são salvos na tabela `application_files` com referência ao `field_id`.

---

## 7. Filtros de Interessados

### 7.1 Interface de Filtros

```
┌─────────────────────────────────────────────────────────────┐
│ Filtros                                                      │
├─────────────────────────────────────────────────────────────┤
│ Status: [Todos ▼]                                           │
│                                                              │
│ + Adicionar filtro                                          │
│                                                              │
│ ┌─────────────┬──────────┬─────────────┬───┐               │
│ │ Moradia   ▼ │ igual  ▼ │ Apartamento │ ✕ │               │
│ └─────────────┴──────────┴─────────────┴───┘               │
│ ┌─────────────┬──────────┬─────────────┬───┐               │
│ │ Telado    ▼ │ igual  ▼ │ Sim       ▼ │ ✕ │               │
│ └─────────────┴──────────┴─────────────┴───┘               │
│                                                              │
│ [Aplicar filtros]  [Limpar]                                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Implementação

1. Ao carregar a tela, buscar os campos do formulário vinculado ao gato
2. Filtrar apenas campos com `filterable: true`
3. Montar UI de filtros dinamicamente
4. Ao aplicar, construir query que filtra no JSON:

```typescript
// Exemplo de query com Drizzle + SQLite JSON
const filteredApplications = await db
  .select()
  .from(applications)
  .where(
    and(
      eq(applications.catId, catId),
      sql`json_extract(responses, '$.${moradiaFieldId}') = 'Apartamento'`,
      sql`json_extract(responses, '$.${teladoFieldId}') = true`
    )
  );
```

---

## 8. Integrações

### 8.1 Resend (Email)

**Emails a implementar:**
- Confirmação de candidatura (com código de 6 dígitos)
- Convite para novo usuário

**Configuração:**
```env
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@seudominio.com
```

### 8.2 Cloudflare R2 (Storage)

**Buckets sugeridos:**
- `cat-photos` - Fotos dos gatos
- `application-files` - Fotos/vídeos das candidaturas
- `adoption-terms` - PDFs dos termos de adoção

**Limites sugeridos:**
- Fotos: max 5MB cada
- Vídeos: max 50MB, 30 segundos
- PDFs: max 10MB

### 8.3 WhatsApp

**MVP:** Apenas link direto `https://wa.me/5511999999999`

**Futuro:** Integração com API oficial ou Evolution API para:
- Enviar mensagem automática ao aprovar
- Notificar candidato sobre status

---

## 9. Dashboard - Métricas

### Métricas a Exibir

| Métrica | Descrição |
|---------|-----------|
| Total de gatos | Por status (disponível, em processo, adotado) |
| Candidaturas no período | Últimos 7, 30, 90 dias |
| Taxa de conversão | Candidaturas → Adoções |
| Gatos mais procurados | Top 5 com mais candidaturas |
| Tempo médio até adoção | Dias entre cadastro e adoção |
| Candidaturas por status | Novo, em análise, aprovado, rejeitado |

### Filtros do Dashboard
- Período: últimos 7 dias, 30 dias, 90 dias, personalizado

---

## 10. Permissões por Role

| Funcionalidade | Admin | Voluntário |
|----------------|-------|------------|
| Ver dashboard | ✅ | ✅ |
| CRUD de gatos | ✅ | ✅ |
| Duplicar gato | ✅ | ✅ |
| Ver interessados | ✅ | ✅ |
| Alterar status de candidato | ✅ | ✅ |
| Marcar gato como adotado | ✅ | ✅ |
| Ver gatos adotados | ✅ | ✅ |
| CRUD de formulários | ✅ | ❌ |
| Gerenciar usuários | ✅ | ❌ |
| Convidar usuários | ✅ | ❌ |

**Regra especial:** Não é possível remover/desativar o último admin.

---

## 11. Priorização de Desenvolvimento

### Fase 1 - Core (Semanas 1-3)
1. Setup do projeto (Next.js, Drizzle, Turso, Better Auth)
2. Estrutura do banco de dados
3. Autenticação (login, sessão)
4. CRUD de gatos (sem formulário dinâmico ainda)
5. Site público básico (listagem, detalhes)

### Fase 2 - Formulários (Semanas 4-5)
6. CRUD de formulários dinâmicos
7. Editor de campos (todos os tipos)
8. Campos condicionais
9. Vinculação formulário ↔ gato

### Fase 3 - Candidaturas (Semanas 6-7)
10. Formulário público dinâmico
11. Upload de mídia (R2)
12. Confirmação por email (Resend)
13. Listagem de interessados com filtros

### Fase 4 - Adoções (Semana 8)
14. Fluxo de marcar como adotado
15. Tela de gatos adotados
16. Upload do termo de adoção

### Fase 5 - Extras (Semanas 9-10)
17. Dashboard com métricas
18. Sistema de convites
19. Gerenciamento de usuários
20. Duplicar gato

---

## 12. Estimativa de Complexidade

| Módulo | Complexidade | Justificativa |
|--------|--------------|---------------|
| Auth + Usuários | Média | Better Auth ajuda, mas convites são custom |
| CRUD Gatos | Baixa | CRUD padrão com upload |
| Formulários Dinâmicos | Alta | Core do sistema, muita lógica |
| Campos Condicionais | Alta | Lógica de dependência entre campos |
| Upload de Mídia | Média | Integração R2, validações |
| Filtros Dinâmicos | Alta | Query dinâmica em JSON |
| Site Público | Baixa | Listagem e modais |
| Dashboard | Média | Queries de agregação |
| Adoções | Baixa | CRUD com upload |

---

## 13. Considerações Técnicas

### 13.1 Performance
- Índices no banco: `org_id`, `cat_id`, `status`, `created_at`
- Paginação em todas as listagens
- Lazy loading de imagens no site público

### 13.2 Segurança
- Validação de `org_id` em todas as queries (middleware tRPC)
- Sanitização de inputs
- Rate limiting no formulário público
- Validação de tipo/tamanho de arquivos

### 13.3 UX Importantes
- Cadastro de gato deve ser rápido (poucos cliques)
- Feedback visual ao salvar/enviar
- Confirmação antes de ações destrutivas
- Loading states em todas as ações assíncronas

---

## 14. Estrutura de Pastas Sugerida

```
src/
├── app/
│   ├── (public)/           # Site público
│   │   ├── page.tsx        # Home com gatos
│   │   └── gato/[id]/      # Detalhes (se não usar modal)
│   ├── (auth)/
│   │   ├── login/
│   │   └── convite/[token]/
│   ├── admin/
│   │   ├── layout.tsx      # Layout com sidebar
│   │   ├── dashboard/
│   │   ├── gatos/
│   │   │   ├── page.tsx    # Listagem
│   │   │   ├── novo/
│   │   │   └── [id]/
│   │   │       ├── editar/
│   │   │       └── interessados/
│   │   ├── adotados/
│   │   ├── formularios/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   └── usuarios/
│   └── api/
│       └── trpc/
├── server/
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema
│   │   └── index.ts
│   ├── trpc/
│   │   ├── router.ts
│   │   └── routers/
│   │       ├── cats.ts
│   │       ├── forms.ts
│   │       ├── applications.ts
│   │       ├── adoptions.ts
│   │       └── users.ts
│   └── services/
│       ├── email.ts
│       └── storage.ts
├── components/
│   ├── ui/                 # Componentes base
│   ├── forms/              # Form builder components
│   └── admin/              # Componentes do admin
├── lib/
│   ├── auth.ts
│   └── utils.ts
└── types/
    └── index.ts
```

---

## 15. Próximos Passos

1. **Validar este documento** - Revisar se algo ficou faltando
2. **Criar projeto** - Setup inicial com a stack definida
3. **Modelar banco** - Criar schema Drizzle completo
4. **Implementar auth** - Login funcional
5. **Começar pelo CRUD de gatos** - Base do sistema
6. **Iterar** - Seguir a priorização definida

---

*Documento gerado em: Janeiro/2025*
*Versão: 1.0 - MVP*
