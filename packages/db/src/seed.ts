import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { Scrypt } from 'oslo/password'

import * as schema from './schema'

dotenv.config({ path: '../../apps/web/.env' })

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const db = drizzle({ client, schema })

function buildCatPhotoUrl(seed: number): string {
  // Stable image per lock value, useful for visual testing in development.
  return `https://loremflickr.com/1200/900/cat?lock=${seed}`
}

function normalizeNameForSearch(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

type R2Helpers = {
  deleteFile: (key: string) => Promise<void>
  getKeyFromUrl: (url: string) => string | null
}

async function getR2Helpers(): Promise<R2Helpers | null> {
  try {
    const modulePath = '../../api/src/lib/r2'
    const module = (await import(modulePath)) as R2Helpers
    return module
  } catch (error) {
    console.warn(
      '⚠️  Não foi possível carregar helpers de R2. Limpeza de arquivos será ignorada.',
      error
    )
    return null
  }
}

async function ensureColumnExists(params: {
  table: string
  column: string
  alterSql: string
}): Promise<void> {
  const info = await client.execute(`PRAGMA table_info(${params.table})`)
  const hasColumn = info.rows.some(
    (row) => String((row as Record<string, unknown>).name) === params.column
  )

  if (hasColumn) {
    return
  }

  await client.execute(params.alterSql)
  console.warn(`✅ Coluna adicionada: ${params.table}.${params.column}`)
}

async function buildFormSnapshot(
  formId: string
): Promise<schema.CatFormFieldSnapshot[]> {
  const fields = await db
    .select({
      id: schema.formFields.id,
      type: schema.formFields.type,
      label: schema.formFields.label,
      required: schema.formFields.required,
      helpText: schema.formFields.helpText,
      options: schema.formFields.options,
      condition: schema.formFields.condition,
      mediaConfig: schema.formFields.mediaConfig,
      order: schema.formFields.order,
    })
    .from(schema.formFields)
    .where(eq(schema.formFields.formId, formId))
    .orderBy(schema.formFields.order)

  return fields.map((field) => ({
    id: field.id,
    type: field.type,
    label: field.label,
    required: field.required,
    helpText: field.helpText,
    options: field.options,
    condition: field.condition,
    mediaConfig: field.mediaConfig,
    order: field.order,
  }))
}

async function seed() {
  console.log('🌱 Seeding database...')

  // Compatibilidade para ambientes que ficaram com histórico de migration divergente.
  await ensureColumnExists({
    table: 'cats',
    column: 'form_snapshot',
    alterSql: 'ALTER TABLE cats ADD COLUMN form_snapshot text',
  })
  await ensureColumnExists({
    table: 'applications',
    column: 'applicant_name_normalized',
    alterSql:
      "ALTER TABLE applications ADD COLUMN applicant_name_normalized text DEFAULT '' NOT NULL",
  })

  // Verificar se org já existe
  const existingOrg = await db.query.orgs.findFirst({
    where: (orgs, { eq }) => eq(orgs.slug, 'petlar'),
  })

  let orgId: string

  if (existingOrg) {
    console.log(`⏭️  Org já existe: PetLar (id: ${existingOrg.id})`)
    orgId = existingOrg.id
  } else {
    // Criar org de teste
    orgId = crypto.randomUUID()
    await db.insert(schema.orgs).values({
      id: orgId,
      name: 'PetLar',
      slug: 'petlar',
      logoUrl: null,
    })
    console.log(`✅ Org criada: PetLar (id: ${orgId})`)
  }

  // Seed de usuários da equipe (inclui admin + voluntários) para testes de gestão.
  const defaultSeedPassword = '123456'
  const userActivityStepMs = 6 * 60 * 60 * 1000
  const dayMs = 24 * 60 * 60 * 1000

  // 40 usuários para 3 páginas de 15 itens
  const teamUsers: Array<{
    name: string
    email: string
    role: 'admin' | 'volunteer'
    active: boolean
  }> = [
    // Admins (5)
    {
      name: 'Admin PetLar',
      email: 'admin@petlar.com',
      role: 'admin',
      active: true,
    },
    {
      name: 'Mariana Soares',
      email: 'mariana.soares@petlar.com',
      role: 'admin',
      active: true,
    },
    {
      name: 'Rafael Mendes',
      email: 'rafael.mendes@petlar.com',
      role: 'admin',
      active: true,
    },
    {
      name: 'Camila Ferreira',
      email: 'camila.ferreira@petlar.com',
      role: 'admin',
      active: true,
    },
    {
      name: 'Gustavo Santos',
      email: 'gustavo.santos@petlar.com',
      role: 'admin',
      active: true,
    },
    // Voluntários ativos (30)
    {
      name: 'Ana Oliveira',
      email: 'ana.oliveira@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Bruno Costa',
      email: 'bruno.costa@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Carla Souza',
      email: 'carla.souza@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Diego Ferreira',
      email: 'diego.ferreira@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Eduarda Lima',
      email: 'eduarda.lima@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Felipe Almeida',
      email: 'felipe.almeida@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Giovana Martins',
      email: 'giovana.martins@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Henrique Rocha',
      email: 'henrique.rocha@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Isabela Gomes',
      email: 'isabela.gomes@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Joao Nascimento',
      email: 'joao.nascimento@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Karen Barbosa',
      email: 'karen.barbosa@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Lucas Araujo',
      email: 'lucas.araujo@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Natalia Vieira',
      email: 'natalia.vieira@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Otavio Pires',
      email: 'otavio.pires@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Patricia Neves',
      email: 'patricia.neves@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Renato Dias',
      email: 'renato.dias@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Sandra Moura',
      email: 'sandra.moura@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Tiago Ramos',
      email: 'tiago.ramos@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Ursula Campos',
      email: 'ursula.campos@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Vinicius Lopes',
      email: 'vinicius.lopes@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Wanda Teixeira',
      email: 'wanda.teixeira@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Xavier Cunha',
      email: 'xavier.cunha@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Yara Cardoso',
      email: 'yara.cardoso@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Zilda Freitas',
      email: 'zilda.freitas@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Amanda Reis',
      email: 'amanda.reis@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Bernardo Mello',
      email: 'bernardo.mello@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Clara Duarte',
      email: 'clara.duarte@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Daniel Farias',
      email: 'daniel.farias@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Elena Borges',
      email: 'elena.borges@petlar.com',
      role: 'volunteer',
      active: true,
    },
    {
      name: 'Fabio Castro',
      email: 'fabio.castro@petlar.com',
      role: 'volunteer',
      active: true,
    },
    // Voluntários inativos (5)
    {
      name: 'Pedro Moreira',
      email: 'pedro.moreira@petlar.com',
      role: 'volunteer',
      active: false,
    },
    {
      name: 'Sofia Ribeiro',
      email: 'sofia.ribeiro@petlar.com',
      role: 'volunteer',
      active: false,
    },
    {
      name: 'Ricardo Monteiro',
      email: 'ricardo.monteiro@petlar.com',
      role: 'volunteer',
      active: false,
    },
    {
      name: 'Julia Fernandes',
      email: 'julia.fernandes@petlar.com',
      role: 'volunteer',
      active: false,
    },
    {
      name: 'Marcos Andrade',
      email: 'marcos.andrade@petlar.com',
      role: 'volunteer',
      active: false,
    },
  ]

  const scrypt = new Scrypt()
  const hashedPassword = await scrypt.hash(defaultSeedPassword)
  const now = Date.now()
  let usersCreated = 0
  let usersUpdated = 0
  let accountsCreated = 0

  for (const [index, teamUser] of teamUsers.entries()) {
    const existingUser = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.email, teamUser.email),
    })

    const lastSeenAt = teamUser.active
      ? new Date(now - (index + 1) * userActivityStepMs)
      : null
    const lastLoginAt = teamUser.active
      ? new Date(now - (index + 1) * userActivityStepMs * 2)
      : null

    if (existingUser) {
      await db
        .update(schema.user)
        .set({
          name: teamUser.name,
          emailVerified: true,
          orgId,
          role: teamUser.role,
          active: teamUser.active,
          lastSeenAt,
          lastLoginAt,
        })
        .where(eq(schema.user.id, existingUser.id))

      usersUpdated++

      const existingCredentialAccount = await db.query.account.findFirst({
        where: (accounts, { and, eq }) =>
          and(
            eq(accounts.userId, existingUser.id),
            eq(accounts.providerId, 'credential')
          ),
      })

      if (!existingCredentialAccount) {
        await db.insert(schema.account).values({
          id: crypto.randomUUID(),
          accountId: existingUser.id,
          providerId: 'credential',
          userId: existingUser.id,
          password: hashedPassword,
        })
        accountsCreated++
      }

      continue
    }

    const userId = crypto.randomUUID()

    await db.insert(schema.user).values({
      id: userId,
      name: teamUser.name,
      email: teamUser.email,
      emailVerified: true,
      orgId,
      role: teamUser.role,
      active: teamUser.active,
      lastSeenAt,
      lastLoginAt,
      createdAt: new Date(now - (teamUsers.length - index) * dayMs),
    })

    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: hashedPassword,
    })

    usersCreated++
    accountsCreated++
  }

  console.log(
    `✅ Usuários seed: ${usersCreated} criados, ${usersUpdated} atualizados, ${accountsCreated} contas credential criadas (senha: ${defaultSeedPassword})`
  )

  // Buscar o userId para createdBy
  const adminUser = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.email, 'admin@petlar.com'),
  })

  if (!adminUser) {
    console.error('❌ Usuário admin não encontrado')
    process.exit(1)
  }

  // Seed de convites pendentes para testes do admin
  // Sempre recriar convites para ter distribuição correta
  await db.delete(schema.invites).where(eq(schema.invites.orgId, orgId))

  // 25 convites para 3 páginas de 10 itens
  const inviteEmails = [
    'maria.silva@email.com',
    'joao.santos@email.com',
    'ana.oliveira.convite@email.com',
    'pedro.costa@email.com',
    'carla.souza.convite@email.com',
    'lucas.ferreira@email.com',
    'julia.almeida@email.com',
    'bruno.rodrigues@email.com',
    'mariana.lima@email.com',
    'rafael.gomes@email.com',
    'beatriz.martins@email.com',
    'diego.pereira@email.com',
    'fernanda.silva@email.com',
    'gabriel.costa@email.com',
    'helena.santos@email.com',
    'igor.oliveira@email.com',
    'jessica.lima@email.com',
    'kevin.ferreira@email.com',
    'larissa.almeida@email.com',
    'miguel.rodrigues@email.com',
    'nicole.gomes@email.com',
    'otto.martins@email.com',
    'priscila.pereira@email.com',
    'rodrigo.silva@email.com',
    'samara.costa@email.com',
  ]

  const HOUR_MS = 60 * 60 * 1000

  const invitesToCreate = inviteEmails.map((email, index) => {
    // Alternate between admin and volunteer
    const role = index % 3 === 0 ? 'admin' : 'volunteer'

    // Vary expiration times: some expired, some expiring soon, some valid
    let expiresAt: Date
    if (index < 2) {
      // Already expired (1-2 hours ago)
      expiresAt = new Date(now - (index + 1) * HOUR_MS)
    } else if (index < 4) {
      // Expiring soon (1-4 hours)
      expiresAt = new Date(now + (index + 1) * HOUR_MS)
    } else {
      // Valid (24-48 hours)
      expiresAt = new Date(now + (24 + index) * HOUR_MS)
    }

    // Vary creation times
    const createdAt = new Date(now - (25 - index) * 2 * HOUR_MS)

    return {
      id: crypto.randomUUID(),
      orgId,
      email,
      role: role as 'admin' | 'volunteer',
      token: crypto.randomUUID(),
      expiresAt,
      usedAt: null,
      invitedById: adminUser.id,
      createdAt,
    }
  })

  await db.insert(schema.invites).values(invitesToCreate)
  console.log(`✅ ${invitesToCreate.length} convites de teste criados`)

  // Garantir formulário padrão para candidaturas
  const defaultFormName = 'Formulário padrão de adoção'

  let defaultFormId: string

  const existingDefaultForm = await db.query.forms.findFirst({
    where: (forms, { and, eq }) =>
      and(eq(forms.orgId, orgId), eq(forms.name, defaultFormName)),
  })

  if (existingDefaultForm) {
    defaultFormId = existingDefaultForm.id
    console.log(`⏭️  Formulário padrão já existe (id: ${defaultFormId})`)
  } else {
    defaultFormId = crypto.randomUUID()

    await db.insert(schema.forms).values({
      id: defaultFormId,
      orgId,
      name: defaultFormName,
      description: 'Modelo inicial para candidatura de adoção no site público.',
      active: true,
    })

    console.log(`✅ Formulário padrão criado (id: ${defaultFormId})`)
  }

  const existingDefaultFormField = await db
    .select({ id: schema.formFields.id })
    .from(schema.formFields)
    .where(eq(schema.formFields.formId, defaultFormId))
    .limit(1)

  if (existingDefaultFormField.length === 0) {
    const housingFieldId = crypto.randomUUID()
    const apartmentVideoFieldId = crypto.randomUUID()

    await db.insert(schema.formFields).values([
      {
        id: housingFieldId,
        formId: defaultFormId,
        order: 1,
        type: 'select',
        label: 'Tipo de moradia',
        required: true,
        helpText: 'Selecione a opção que melhor descreve sua casa.',
        options: ['Casa', 'Apartamento'],
        condition: null,
        mediaConfig: null,
      },
      {
        id: apartmentVideoFieldId,
        formId: defaultFormId,
        order: 2,
        type: 'media',
        label: 'Envie um vídeo mostrando as telas das janelas',
        required: true,
        helpText:
          'Esse campo aparece apenas para apartamentos e ajuda na avaliação de segurança.',
        options: null,
        condition: {
          fieldId: housingFieldId,
          operator: 'equals',
          value: 'Apartamento',
        },
        mediaConfig: { kind: 'video' },
      },
      {
        id: crypto.randomUUID(),
        formId: defaultFormId,
        order: 3,
        type: 'boolean',
        label: 'Todos na casa concordam com a adoção?',
        required: true,
        helpText: null,
        options: null,
        condition: null,
        mediaConfig: null,
      },
      {
        id: crypto.randomUUID(),
        formId: defaultFormId,
        order: 4,
        type: 'textarea',
        label: 'Conte um pouco sobre sua rotina com pets',
        required: true,
        helpText: 'Inclua horários, companhia e experiência anterior.',
        options: null,
        condition: null,
        mediaConfig: null,
      },
    ])

    console.log('✅ Campos padrão do formulário criados')
  }

  const defaultFormSnapshot = await buildFormSnapshot(defaultFormId)

  // Limpar gatos existentes para recriar com distribuição correta de status
  const existingCats = await db
    .select({ id: schema.cats.id })
    .from(schema.cats)
    .where(eq(schema.cats.orgId, orgId))

  if (existingCats.length > 0) {
    // Deletar fotos primeiro (FK constraint)
    await db
      .delete(schema.catPhotos)
      .where(
        sql`${schema.catPhotos.catId} in ${existingCats.map((c) => c.id)}`
      )
    // Deletar gatos
    await db.delete(schema.cats).where(eq(schema.cats.orgId, orgId))
    console.log(`🗑️  ${existingCats.length} gatos antigos removidos`)
  }

  // Nomes de gatos variados (expandido para 80+ gatos para testar paginação)
  const catNames = [
    // Original 35
    'Luna',
    'Simba',
    'Mimi',
    'Thor',
    'Mel',
    'Felix',
    'Nina',
    'Tom',
    'Frida',
    'Garfield',
    'Belinha',
    'Whiskers',
    'Pipoca',
    'Frajola',
    'Mingau',
    'Biscuit',
    'Pantera',
    'Flor',
    'Tigre',
    'Amora',
    'Bob',
    'Sushi',
    'Bolinha',
    'Chico',
    'Marley',
    'Nala',
    'Oliver',
    'Pituca',
    'Romeo',
    'Salém',
    'Toddy',
    'Zoe',
    'Apolo',
    'Cacau',
    'Duque',
    // Novos 50+ para paginação
    'Mia',
    'Leo',
    'Cleo',
    'Max',
    'Lila',
    'Oscar',
    'Chloe',
    'Charlie',
    'Lucy',
    'Milo',
    'Sophie',
    'Jack',
    'Daisy',
    'Rocky',
    'Maggie',
    'Buddy',
    'Molly',
    'Duke',
    'Sadie',
    'Tucker',
    'Bailey',
    'Cooper',
    'Zoey',
    'Bear',
    'Stella',
    'Bentley',
    'Lola',
    'Winston',
    'Penny',
    'Toby',
    'Ruby',
    'Murphy',
    'Gracie',
    'Riley',
    'Coco',
    'Jake',
    'Rosie',
    'Bruno',
    'Lily',
    'Gus',
    'Abby',
    'Hank',
    'Ellie',
    'Zeus',
    'Roxy',
    'Louie',
    'Millie',
    'Finn',
    'Willow',
    'Shadow',
  ]

  const sexOptions = ['male', 'female'] as const
  const testResults = ['positive', 'negative', 'not_tested'] as const

  const descriptions = [
    'Muito carinhoso e brincalhão. Adora colo!',
    'Aventureiro e curioso. Explora tudo!',
    'Calmo e tranquilo. Perfeito para apartamento.',
    'Brincalhão e cheio de energia. Precisa de espaço!',
    'Tímido no início, mas muito amoroso depois.',
    'Sociável com outros gatos. Ótimo para lares com pets.',
    'Independente mas carinhoso. Gosta de rotina.',
    'Filhote esperto e ativo. Aprende rápido!',
  ]

  // Distribuição inicial de status para listagem de gatos (admin):
  // - 50 available
  // - 35 in_progress
  // Adoções serão criadas depois para um subconjunto determinístico.
  const INITIAL_AVAILABLE_COUNT = 50
  const SEEDED_ADOPTIONS_COUNT = 25

  const getStatus = (index: number): 'available' | 'in_progress' => {
    if (index < INITIAL_AVAILABLE_COUNT) return 'available'
    return 'in_progress'
  }

  const catsToCreate = catNames.map((name, index) => ({
    id: crypto.randomUUID(),
    orgId: orgId,
    name,
    ageYears: Math.floor(Math.random() * 10),
    ageMonths: Math.floor(Math.random() * 12),
    sex: sexOptions[index % sexOptions.length]!,
    fiv: testResults[index % testResults.length]!,
    felv: testResults[(index + 1) % testResults.length]!,
    castrated: index % 3 !== 0,
    vaccinated: index % 4 !== 0,
    vaccinationNotes: index % 4 !== 0 ? 'Vacinas em dia' : null,
    dewormed: index % 2 === 0,
    dewormingNotes: null,
    description: descriptions[index % descriptions.length]!,
    status: getStatus(index),
    formId: defaultFormId,
    formSnapshot: defaultFormSnapshot,
    createdBy: adminUser.id,
  }))

  await db.insert(schema.cats).values(catsToCreate)
  console.log(`✅ ${catsToCreate.length} gatos criados`)

  const catsWithoutForm = await db
    .select({ id: schema.cats.id })
    .from(schema.cats)
    .where(
      and(eq(schema.cats.orgId, orgId), sql`${schema.cats.formId} is null`)
    )

  if (catsWithoutForm.length > 0) {
    await db
      .update(schema.cats)
      .set({ formId: defaultFormId, formSnapshot: defaultFormSnapshot })
      .where(
        and(eq(schema.cats.orgId, orgId), sql`${schema.cats.formId} is null`)
      )
    console.log(
      `✅ ${catsWithoutForm.length} gatos vinculados ao formulário padrão`
    )
  }

  const catsWithoutSnapshot = await db
    .select({
      id: schema.cats.id,
      formId: schema.cats.formId,
    })
    .from(schema.cats)
    .where(
      and(
        eq(schema.cats.orgId, orgId),
        sql`${schema.cats.formSnapshot} is null`
      )
    )

  if (catsWithoutSnapshot.length > 0) {
    const snapshotCache = new Map<string, schema.CatFormFieldSnapshot[]>()

    for (const cat of catsWithoutSnapshot) {
      const cached = snapshotCache.get(cat.formId)
      const snapshot = cached ?? (await buildFormSnapshot(cat.formId))
      if (!cached) {
        snapshotCache.set(cat.formId, snapshot)
      }

      await db
        .update(schema.cats)
        .set({ formSnapshot: snapshot })
        .where(eq(schema.cats.id, cat.id))
    }

    console.log(
      `✅ Snapshot de formulário preenchido em ${catsWithoutSnapshot.length} gatos`
    )
  }

  // Garantir que todos os gatos tenham pelo menos 1 foto.
  // Também adiciona variação de 1 a 3 fotos para testar o carrossel no site público.
  const orgCats = await db
    .select({ id: schema.cats.id, name: schema.cats.name })
    .from(schema.cats)
    .where(eq(schema.cats.orgId, orgId))

  if (orgCats.length === 0) {
    console.log('⚠️  Nenhum gato encontrado para gerar fotos.')
  } else {
    const catIds = orgCats.map((cat) => cat.id)

    const existingPhotos =
      catIds.length > 0
        ? await db
            .select({
              catId: schema.catPhotos.catId,
            })
            .from(schema.catPhotos)
            .where(sql`${schema.catPhotos.catId} in ${catIds}`)
        : []

    const catsWithPhotos = new Set(existingPhotos.map((photo) => photo.catId))

    const photosToInsert = orgCats.flatMap((cat, index) => {
      if (catsWithPhotos.has(cat.id)) {
        return []
      }

      const photoCount = index % 3 === 0 ? 3 : index % 2 === 0 ? 2 : 1

      return Array.from({ length: photoCount }, (_, photoIndex) => ({
        id: crypto.randomUUID(),
        catId: cat.id,
        order: photoIndex + 1,
        url: buildCatPhotoUrl((index + 1) * 10 + photoIndex + 1),
      }))
    })

    if (photosToInsert.length > 0) {
      await db.insert(schema.catPhotos).values(photosToInsert)
      console.log(
        `✅ ${photosToInsert.length} fotos adicionadas para gatos sem imagem`
      )
    } else {
      console.log('⏭️  Todos os gatos já possuem foto')
    }
  }

  // Limpeza inicial para org de teste (petlar): remove candidaturas + arquivos no R2.
  const existingApplicationFiles = await db
    .select({ url: schema.applicationFiles.url })
    .from(schema.applicationFiles)
    .innerJoin(
      schema.applications,
      eq(schema.applicationFiles.applicationId, schema.applications.id)
    )
    .where(eq(schema.applications.orgId, orgId))

  const r2Helpers = await getR2Helpers()

  if (existingApplicationFiles.length > 0 && r2Helpers) {
    await Promise.all(
      existingApplicationFiles.map(async ({ url }) => {
        const key = r2Helpers.getKeyFromUrl(url)
        if (!key) return

        try {
          await r2Helpers.deleteFile(key)
        } catch (error) {
          console.warn('⚠️  Falha ao remover arquivo da candidatura no R2:', {
            url,
            error,
          })
        }
      })
    )
    console.log(
      `✅ Tentativa de limpeza no R2 para ${existingApplicationFiles.length} arquivos de candidatura`
    )
  } else if (existingApplicationFiles.length > 0) {
    console.log(
      `⚠️  ${existingApplicationFiles.length} arquivos não removidos do R2 (helpers indisponíveis)`
    )
  }

  const deletedApplications = await db
    .delete(schema.applications)
    .where(eq(schema.applications.orgId, orgId))
    .returning({ id: schema.applications.id })

  console.log(
    `✅ ${deletedApplications.length} candidaturas antigas removidas da org petlar`
  )

  // Seed de candidaturas confirmadas para testes do admin (3 a 8 por gato, status pending).
  const candidatesFirstNames = [
    'Ana',
    'Bruno',
    'Carla',
    'Diego',
    'Eduarda',
    'Felipe',
    'Giovana',
    'Henrique',
    'Isabela',
    'João',
    'Karina',
    'Luís',
    'Marina',
    'Nicolas',
    'Otávio',
    'Paula',
    'Rafael',
    'Sofia',
    'Thiago',
    'Vitória',
  ]

  const candidatesLastNames = [
    'Silva',
    'Souza',
    'Oliveira',
    'Santos',
    'Pereira',
    'Costa',
    'Almeida',
    'Rodrigues',
    'Ferreira',
    'Gomes',
    'Martins',
    'Araújo',
  ]

  const orgCatsForApplications = await db
    .select({
      id: schema.cats.id,
      name: schema.cats.name,
      formId: schema.cats.formId,
      formSnapshot: schema.cats.formSnapshot,
    })
    .from(schema.cats)
    .where(eq(schema.cats.orgId, orgId))

  const snapshotCache = new Map<string, schema.CatFormFieldSnapshot[]>()

  const applicationsToInsert: Array<typeof schema.applications.$inferInsert> =
    []
  const applicationFilesToInsert: Array<
    typeof schema.applicationFiles.$inferInsert
  > = []

  let globalCandidateIndex = 0

  for (const [catIndex, cat] of orgCatsForApplications.entries()) {
    let snapshot = cat.formSnapshot
    if (!snapshot || snapshot.length === 0) {
      const cached = snapshotCache.get(cat.formId)
      snapshot = cached ?? (await buildFormSnapshot(cat.formId))
      if (!cached) {
        snapshotCache.set(cat.formId, snapshot)
      }

      await db
        .update(schema.cats)
        .set({ formSnapshot: snapshot })
        .where(eq(schema.cats.id, cat.id))
    }

    // Primeiros 5 gatos têm 20-35 interessados para testar paginação (15/página)
    // Demais têm 3-8 interessados
    const applicationsCount =
      catIndex < 5 ? randomInt(20, 35) : randomInt(3, 8)

    for (
      let applicationIndex = 0;
      applicationIndex < applicationsCount;
      applicationIndex++
    ) {
      globalCandidateIndex += 1

      const firstName =
        candidatesFirstNames[
          globalCandidateIndex % candidatesFirstNames.length
        ]!
      const lastName =
        candidatesLastNames[globalCandidateIndex % candidatesLastNames.length]!
      const applicantName = `${firstName} ${lastName}`
      const applicantNameNormalized = normalizeNameForSearch(applicantName)
      const applicantEmail = `candidato+${catIndex + 1}-${applicationIndex + 1}@petlar.dev`
      const applicantWhatsapp = `119${String(80000000 + globalCandidateIndex).slice(0, 8)}`
      const createdAt = new Date(
        Date.now() - (catIndex * 8 + applicationIndex + 1) * 6 * 60 * 60 * 1000
      )
      const confirmedAt = new Date(createdAt.getTime() + 10 * 60 * 1000)

      const responses: Record<string, string | boolean | null> = {}
      const filesForApplication: Array<
        typeof schema.applicationFiles.$inferInsert
      > = []

      for (const field of [...snapshot].sort((a, b) => a.order - b.order)) {
        if (field.condition) {
          const parentValue = responses[field.condition.fieldId]
          if (parentValue !== field.condition.value) {
            continue
          }
        }

        if (field.type === 'select') {
          const options = field.options ?? []
          responses[field.id] =
            options.length > 0
              ? options[(globalCandidateIndex + field.order) % options.length]!
              : null
          continue
        }

        if (field.type === 'boolean') {
          responses[field.id] = (globalCandidateIndex + field.order) % 2 === 0
          continue
        }

        if (field.type === 'date') {
          const day = ((globalCandidateIndex + field.order) % 26) + 1
          responses[field.id] = `2026-01-${String(day).padStart(2, '0')}`
          continue
        }

        if (field.type === 'textarea') {
          responses[field.id] =
            `Tenho rotina estável e experiência com gatos. Candidatura ${globalCandidateIndex}.`
          continue
        }

        if (field.type === 'media') {
          const mediaKind = field.mediaConfig?.kind ?? 'image'
          const placeholderToken = `${Date.now()}-${catIndex}-${applicationIndex}-${field.order}-${randomInt(1000, 9999)}`
          const mediaUrl =
            mediaKind === 'image'
              ? `https://picsum.photos/seed/petlar-app-${placeholderToken}/1200/900`
              : `https://example.com/mock-video-${placeholderToken}.mp4`

          responses[field.id] = mediaUrl
          filesForApplication.push({
            id: crypto.randomUUID(),
            applicationId: '',
            fieldId: field.id,
            url: mediaUrl,
            fileType: mediaKind,
          })
          continue
        }

        responses[field.id] =
          `Resposta ${globalCandidateIndex} - ${field.label}`
      }

      const applicationId = crypto.randomUUID()

      applicationsToInsert.push({
        id: applicationId,
        orgId,
        catId: cat.id,
        formId: cat.formId,
        status: 'pending',
        applicantName,
        applicantNameNormalized,
        applicantEmail,
        applicantWhatsapp,
        responses,
        lgpdConsent: true,
        whatsappConsent: true,
        confirmationToken: null,
        confirmationCodeHash: null,
        confirmationCodeExpiresAt: null,
        confirmationResendCount: 0,
        confirmationLastSentAt: null,
        confirmedAt,
        createdAt,
        updatedAt: createdAt,
      })

      for (const file of filesForApplication) {
        applicationFilesToInsert.push({
          ...file,
          applicationId,
        })
      }
    }
  }

  if (applicationsToInsert.length > 0) {
    await db.insert(schema.applications).values(applicationsToInsert)
    console.log(
      `✅ ${applicationsToInsert.length} candidaturas confirmadas de teste criadas`
    )
  }

  if (applicationFilesToInsert.length > 0) {
    await db.insert(schema.applicationFiles).values(applicationFilesToInsert)
    console.log(
      `✅ ${applicationFilesToInsert.length} arquivos de candidatura de teste criados`
    )
  }

  // Seed de adoções para um subconjunto determinístico de gatos.
  // O status muda para "adopted" apenas quando há registro em adoptions.
  await db.delete(schema.adoptions).where(eq(schema.adoptions.orgId, orgId))

  const catsForAdoptionSeed = catsToCreate
    .filter((cat) => cat.status === 'in_progress')
    .slice(0, SEEDED_ADOPTIONS_COUNT)

  const adopterFirstNames = [
    'Maria',
    'José',
    'Ana',
    'Paulo',
    'Fernanda',
    'Carlos',
    'Juliana',
    'Roberto',
    'Patricia',
    'Lucas',
    'Camila',
    'Eduardo',
    'Beatriz',
    'Thiago',
    'Larissa',
    'Marcelo',
    'Amanda',
    'Ricardo',
    'Vanessa',
    'Felipe',
  ]

  const adopterLastNames = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Rodrigues',
    'Ferreira',
    'Almeida',
    'Costa',
    'Gomes',
    'Martins',
    'Araújo',
    'Melo',
    'Barbosa',
    'Ribeiro',
    'Lima',
    'Carvalho',
    'Pereira',
    'Nunes',
    'Moreira',
    'Castro',
  ]

  const adoptionsToInsert = catsForAdoptionSeed.map((cat, index) => {
    const firstName =
      adopterFirstNames[index % adopterFirstNames.length]!
    const lastName =
      adopterLastNames[index % adopterLastNames.length]!
    const adopterName = `${firstName} ${lastName}`
    const adopterNameNormalized = normalizeNameForSearch(adopterName)

    // Datas variadas nos últimos 6 meses
    const daysAgo = (index + 1) * 5
    const adoptionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    const adoptionDateStr = adoptionDate.toISOString().split('T')[0]!

    return {
      id: crypto.randomUUID(),
      orgId,
      catId: cat.id,
      applicationId: null,
      adopterName,
      adopterNameNormalized,
      adopterPhone: `119${String(90000000 + index).slice(0, 8)}`,
      adopterEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      adoptionDate: adoptionDateStr,
      adoptionTermUrl: null,
      notes:
        index % 3 === 0
          ? `Adoção realizada com sucesso. ${cat.name} está muito feliz em seu novo lar!`
          : null,
      createdBy: adminUser.id,
    }
  })

  if (adoptionsToInsert.length > 0) {
    await db.transaction(async (tx) => {
      await tx.insert(schema.adoptions).values(adoptionsToInsert)
      await tx
        .update(schema.cats)
        .set({ status: 'adopted' })
        .where(
          and(
            eq(schema.cats.orgId, orgId),
            inArray(
              schema.cats.id,
              catsForAdoptionSeed.map((cat) => cat.id)
            )
          )
        )
    })

    console.log(`✅ ${adoptionsToInsert.length} registros de adoção criados`)
    console.log(
      `✅ ${adoptionsToInsert.length} gatos tiveram status atualizado para adopted`
    )
  }

  console.log('🌱 Seed concluído!')
}

seed()
  .catch((error) => {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
