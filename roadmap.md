# Roadmap de Tarefas - MVP Sistema de Adoção de Gatos

## Fase 1: Setup e Infraestrutura

### 1.1 Setup do Projeto

- [x] Criar projeto Next.js 15+ com App Router
- [x] Configurar TypeScript strict mode
- [x] Configurar ESLint e Prettier
- [x] Configurar Tailwind CSS
- [x] Instalar e configurar shadcn/ui

### 1.2 Banco de Dados

- [x] Criar conta/projeto no Turso
- [x] Instalar Drizzle ORM + drizzle-kit
- [x] Configurar conexão com Turso
- [x] Criar schema inicial (tabela orgs)
- [x] Configurar migrations
- [x] Criar seed inicial (org de teste)

### 1.3 tRPC

- [ ] Instalar tRPC + @trpc/next
- [ ] Configurar tRPC server
- [ ] Configurar tRPC client
- [ ] Criar router base
- [ ] Testar rota de health check

### 1.4 Autenticação

- [ ] Instalar e configurar Better Auth
- [ ] Criar tabelas de users e sessions no schema
- [ ] Configurar middleware de auth
- [ ] Criar página de login
- [ ] Implementar logout
- [ ] Criar contexto de usuário logado

---

## Fase 2: CRUD de Gatos (Base)

### 2.1 Schema de Gatos

- [ ] Criar tabela `cats` no schema
- [ ] Criar tabela `cat_photos` no schema
- [ ] Rodar migration

### 2.2 Storage (Cloudflare R2)

- [ ] Criar conta/bucket no Cloudflare R2
- [ ] Configurar variáveis de ambiente
- [ ] Criar service de upload
- [ ] Criar endpoint de upload de imagem
- [ ] Testar upload e retorno de URL

### 2.3 Backend - Gatos

- [ ] Criar router `cats` no tRPC
- [ ] Implementar `cats.list` (com filtros e paginação)
- [ ] Implementar `cats.getById`
- [ ] Implementar `cats.create`
- [ ] Implementar `cats.update`
- [ ] Implementar `cats.delete`
- [ ] Implementar `cats.duplicate`
- [ ] Implementar `cats.updateStatus`

### 2.4 Frontend - Layout Admin

- [ ] Criar layout do admin com sidebar
- [ ] Criar componente de header com user info
- [ ] Criar navegação (Gatos, Adotados, Formulários, Usuários)
- [ ] Implementar proteção de rotas (redirect se não logado)

### 2.5 Frontend - Listagem de Gatos

- [ ] Criar página `/admin/gatos`
- [ ] Implementar tabela/grid de gatos
- [ ] Implementar filtros (status, sexo, FIV/FeLV)
- [ ] Implementar busca por nome
- [ ] Implementar paginação
- [ ] Adicionar badges de status (disponível, em processo, adotado)
- [ ] Adicionar ações (editar, duplicar, ver interessados, excluir)

### 2.6 Frontend - Criar/Editar Gato

- [ ] Criar página `/admin/gatos/novo`
- [ ] Criar formulário de gato (todos os campos)
- [ ] Implementar upload de 1-3 fotos com preview
- [ ] Implementar reordenação de fotos (drag and drop)
- [ ] Implementar remoção de foto
- [ ] Criar página `/admin/gatos/[id]/editar`
- [ ] Reaproveitar formulário para edição
- [ ] Implementar duplicação (abrir form preenchido)

---

## Fase 3: Formulários Dinâmicos

### 3.1 Schema de Formulários

- [ ] Criar tabela `forms` no schema
- [ ] Criar tabela `form_fields` no schema
- [ ] Adicionar `form_id` na tabela `cats`
- [ ] Rodar migration

### 3.2 Backend - Formulários

- [ ] Criar router `forms` no tRPC
- [ ] Implementar `forms.list`
- [ ] Implementar `forms.getById` (com campos)
- [ ] Implementar `forms.create`
- [ ] Implementar `forms.update`
- [ ] Implementar `forms.delete`
- [ ] Implementar `forms.duplicate`

### 3.3 Backend - Campos

- [ ] Implementar `forms.addField`
- [ ] Implementar `forms.updateField`
- [ ] Implementar `forms.deleteField`
- [ ] Implementar `forms.reorderFields`

### 3.4 Frontend - Listagem de Formulários

- [ ] Criar página `/admin/formularios`
- [ ] Implementar lista de formulários
- [ ] Mostrar quantidade de campos e gatos vinculados
- [ ] Adicionar ações (editar, duplicar, excluir)

### 3.5 Frontend - Editor de Formulário

- [ ] Criar página `/admin/formularios/novo`
- [ ] Criar página `/admin/formularios/[id]`
- [ ] Implementar formulário de dados básicos (nome, descrição)
- [ ] Implementar lista de campos com drag and drop
- [ ] Criar modal/drawer de adicionar campo
- [ ] Implementar todos os tipos de campo:
  - [ ] text
  - [ ] textarea
  - [ ] number
  - [ ] select (com editor de opções)
  - [ ] multiselect (com editor de opções)
  - [ ] boolean
  - [ ] date
  - [ ] media (com config de tipo, duração, tamanho)
- [ ] Implementar toggle de obrigatório
- [ ] Implementar toggle de filtrável
- [ ] Implementar campo condicional:
  - [ ] Selector de campo pai
  - [ ] Selector de operador (igual, diferente)
  - [ ] Input de valor
- [ ] Implementar preview do formulário

### 3.6 Integração Gato + Formulário

- [ ] Adicionar selector de formulário no form de criar gato
- [ ] Mostrar formulário vinculado na listagem de gatos
- [ ] Validar que não pode excluir formulário com gatos vinculados

---

## Fase 4: Site Público

### 4.1 Layout Público

- [ ] Criar layout público (header, footer)
- [ ] Configurar metadata/SEO básico
- [ ] Criar página inicial

### 4.2 Listagem Pública de Gatos

- [ ] Criar grid responsivo de cards de gatos
- [ ] Implementar card do gato (foto, nome, idade, sexo, badges)
- [ ] Implementar filtros públicos (sexo, idade, FIV/FeLV)
- [ ] Implementar busca por nome
- [ ] Mostrar apenas gatos com status 'disponivel'

### 4.3 Modal de Detalhes

- [ ] Criar modal de detalhes do gato
- [ ] Implementar galeria de fotos
- [ ] Mostrar todas as informações
- [ ] Botão "Quero adotar"

### 4.4 Formulário de Candidatura

- [ ] Criar modal de candidatura
- [ ] Implementar campos fixos (nome, email, WhatsApp)
- [ ] Implementar renderização dinâmica dos campos do formulário
- [ ] Implementar lógica de campos condicionais
- [ ] Implementar upload de mídia (foto/vídeo)
- [ ] Implementar validações

### 4.5 Confirmação por Email

- [ ] Configurar Resend
- [ ] Criar template de email de confirmação
- [ ] Implementar geração de código de 6 dígitos
- [ ] Implementar envio de email
- [ ] Criar tela/modal de inserir código
- [ ] Implementar validação do código
- [ ] Salvar candidatura com `confirmed_at`

---

## Fase 5: Gestão de Candidaturas

### 5.1 Schema de Candidaturas

- [ ] Criar tabela `applications` no schema
- [ ] Criar tabela `application_files` no schema
- [ ] Rodar migration

### 5.2 Backend - Candidaturas

- [ ] Criar router `applications` no tRPC
- [ ] Implementar `applications.listByCat` (com filtros)
- [ ] Implementar `applications.getById`
- [ ] Implementar `applications.create` (usado pelo site público)
- [ ] Implementar `applications.confirmCode`
- [ ] Implementar `applications.updateStatus`
- [ ] Implementar filtros dinâmicos baseados no formulário

### 5.3 Frontend - Tela de Interessados

- [ ] Criar página `/admin/gatos/[id]/interessados`
- [ ] Mostrar info do gato no topo
- [ ] Implementar lista de candidaturas
- [ ] Implementar filtro por status (novo, em análise, aprovado, rejeitado)
- [ ] Implementar filtros dinâmicos:
  - [ ] Buscar campos filtráveis do formulário do gato
  - [ ] Renderizar filtros dinamicamente
  - [ ] Implementar lógica de adicionar/remover filtros
  - [ ] Implementar operadores por tipo de campo
- [ ] Implementar card/row do candidato:
  - [ ] Dados básicos (nome, email, WhatsApp)
  - [ ] Badge de status
  - [ ] Botão expandir para ver respostas
  - [ ] Botão ver arquivos (fotos/vídeos)
  - [ ] Botão WhatsApp (abre wa.me)
  - [ ] Dropdown de alterar status

### 5.4 Visualização de Mídia

- [ ] Criar modal de visualização de foto
- [ ] Criar player de vídeo para visualizar vídeos enviados
- [ ] Mostrar qual campo cada arquivo corresponde

---

## Fase 6: Adoções

### 6.1 Schema de Adoções

- [ ] Criar tabela `adoptions` no schema
- [ ] Rodar migration

### 6.2 Backend - Adoções

- [ ] Criar router `adoptions` no tRPC
- [ ] Implementar `adoptions.list` (com filtros e paginação)
- [ ] Implementar `adoptions.getById`
- [ ] Implementar `adoptions.create`
- [ ] Implementar `adoptions.update`
- [ ] Implementar `adoptions.delete`
- [ ] Ao criar adoção, atualizar status do gato para 'adotado'

### 6.3 Frontend - Marcar como Adotado

- [ ] Criar modal "Marcar como adotado" na listagem de gatos
- [ ] Implementar dropdown de candidatos aprovados
- [ ] Implementar campos manuais (nome, WhatsApp, email)
- [ ] Implementar seletor de data
- [ ] Implementar upload do termo de adoção (PDF)
- [ ] Ao salvar, atualizar status do gato

### 6.4 Frontend - Tela de Gatos Adotados

- [ ] Criar página `/admin/adotados`
- [ ] Implementar listagem com filtros (período, busca)
- [ ] Mostrar: foto do gato, nome, adotante, data, WhatsApp
- [ ] Implementar visualização do termo de adoção
- [ ] Implementar edição dos dados da adoção

---

## Fase 7: Gestão de Usuários

### 7.1 Schema de Convites

- [ ] Criar tabela `invites` no schema
- [ ] Rodar migration

### 7.2 Backend - Usuários e Convites

- [ ] Criar router `users` no tRPC
- [ ] Implementar `users.list`
- [ ] Implementar `users.update` (alterar role)
- [ ] Implementar `users.deactivate`
- [ ] Implementar `users.invite`
- [ ] Implementar `users.listInvites`
- [ ] Implementar `users.cancelInvite`
- [ ] Implementar `users.resendInvite`
- [ ] Implementar `users.acceptInvite`
- [ ] Implementar regra: mínimo 1 admin ativo

### 7.3 Email de Convite

- [ ] Criar template de email de convite
- [ ] Implementar envio via Resend

### 7.4 Frontend - Aceitar Convite

- [ ] Criar página `/convite/[token]`
- [ ] Validar token (existe, não expirado, não usado)
- [ ] Mostrar nome da ONG
- [ ] Formulário: nome + senha + confirmar senha
- [ ] Criar conta e redirecionar para login

### 7.5 Frontend - Gerenciar Usuários

- [ ] Criar página `/admin/usuarios` (apenas admin)
- [ ] Implementar lista de usuários ativos
- [ ] Mostrar: nome, email, role, último acesso
- [ ] Implementar alterar role
- [ ] Implementar desativar usuário (com confirmação)
- [ ] Implementar lista de convites pendentes
- [ ] Implementar reenviar convite
- [ ] Implementar cancelar convite
- [ ] Implementar modal de convidar usuário

---

## Fase 8: Dashboard

### 8.1 Backend - Métricas

- [ ] Criar router `dashboard` no tRPC
- [ ] Implementar `dashboard.getMetrics`:
  - [ ] Total de gatos por status
  - [ ] Candidaturas no período
  - [ ] Taxa de conversão
  - [ ] Gatos mais procurados (top 5)
  - [ ] Tempo médio até adoção
  - [ ] Candidaturas por status

### 8.2 Frontend - Dashboard

- [ ] Criar página `/admin/dashboard`
- [ ] Implementar seletor de período (7, 30, 90 dias)
- [ ] Criar cards de métricas principais
- [ ] Criar gráfico de candidaturas por período
- [ ] Criar lista de gatos mais procurados
- [ ] Criar gráfico de pizza de status dos gatos

---

## Fase 9: Polimento e Testes

### 9.1 UX/UI

- [ ] Implementar loading states em todas as ações
- [ ] Implementar empty states (listas vazias)
- [ ] Implementar error states
- [ ] Adicionar confirmações em ações destrutivas
- [ ] Implementar toasts de feedback
- [ ] Revisar responsividade mobile
- [ ] Testar fluxo completo como usuário

### 9.2 Performance

- [ ] Adicionar índices no banco de dados
- [ ] Implementar paginação onde faltou
- [ ] Otimizar queries pesadas
- [ ] Implementar lazy loading de imagens

### 9.3 Segurança

- [ ] Validar org_id em todas as queries
- [ ] Implementar rate limiting no formulário público
- [ ] Validar tipos e tamanhos de arquivos
- [ ] Sanitizar inputs
- [ ] Revisar permissões por role

### 9.4 Testes com Usuários Reais

- [ ] Deploy em ambiente de staging
- [ ] Treinar equipe da ONG
- [ ] Coletar feedback
- [ ] Iterar baseado no feedback

---

## Fase 10: Deploy e Go-Live

### 10.1 Infraestrutura

- [ ] Configurar domínio
- [ ] Configurar Vercel (ou similar)
- [ ] Configurar variáveis de ambiente de produção
- [ ] Configurar backup do banco

### 10.2 Go-Live

- [ ] Deploy em produção
- [ ] Criar usuário admin da ONG
- [ ] Migrar dados existentes (se houver)
- [ ] Monitorar erros e performance
- [ ] Suporte inicial

---

## Resumo por Fase

| Fase      | Descrição              | Tarefas | Estimativa      |
| --------- | ---------------------- | ------- | --------------- |
| 1         | Setup e Infraestrutura | 21      | 3-4 dias        |
| 2         | CRUD de Gatos          | 26      | 5-7 dias        |
| 3         | Formulários Dinâmicos  | 28      | 7-10 dias       |
| 4         | Site Público           | 18      | 4-5 dias        |
| 5         | Gestão de Candidaturas | 20      | 5-7 dias        |
| 6         | Adoções                | 14      | 3-4 dias        |
| 7         | Gestão de Usuários     | 21      | 4-5 dias        |
| 8         | Dashboard              | 9       | 2-3 dias        |
| 9         | Polimento e Testes     | 16      | 4-5 dias        |
| 10        | Deploy e Go-Live       | 8       | 2-3 dias        |
| **Total** |                        | **181** | **~40-50 dias** |

---

## Dicas para Execução

1. **Commits frequentes** - Commite a cada tarefa concluída
2. **Teste enquanto desenvolve** - Não deixe pra testar no final
3. **Foque no happy path primeiro** - Depois trate edge cases
4. **Use o Claude Code** - Cole o plano e peça ajuda tarefa por tarefa
5. **Não pule fases** - A ordem foi pensada para minimizar retrabalho

---

_Roadmap gerado em: Janeiro/2025_
