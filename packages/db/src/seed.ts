import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import { and, eq, sql } from 'drizzle-orm'
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

async function seed() {
  console.log('🌱 Seeding database...')

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

  // Verificar se usuário de teste já existe
  const existingUser = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.email, 'admin@petlar.com'),
  })

  if (existingUser) {
    // Atualizar orgId se não estiver definido
    if (!existingUser.orgId) {
      await db
        .update(schema.user)
        .set({ orgId: orgId, role: 'admin' })
        .where(eq(schema.user.id, existingUser.id))
      console.log(`✅ Usuário atualizado com orgId: admin@petlar.com`)
    } else {
      console.log(`⏭️  Usuário já existe: admin@petlar.com`)
    }
  } else {
    // Criar usuário de teste
    const userId = crypto.randomUUID()
    const accountId = crypto.randomUUID()

    // Hash da senha usando Scrypt (mesmo algoritmo do Better Auth)
    const scrypt = new Scrypt()
    const hashedPassword = await scrypt.hash('123456')

    await db.insert(schema.user).values({
      id: userId,
      name: 'Admin PetLar',
      email: 'admin@petlar.com',
      emailVerified: true,
      orgId: orgId,
      role: 'admin',
    })

    await db.insert(schema.account).values({
      id: accountId,
      accountId: userId,
      providerId: 'credential',
      userId: userId,
      password: hashedPassword,
    })

    console.log(`✅ Usuário criado: admin@petlar.com (senha: 123456)`)
  }

  // Buscar o userId para createdBy
  const adminUser = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.email, 'admin@petlar.com'),
  })

  if (!adminUser) {
    console.error('❌ Usuário admin não encontrado')
    process.exit(1)
  }

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
      description:
        'Modelo inicial para candidatura de adoção no site público.',
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

  // Verificar quantos gatos já existem
  const existingCatsCount = await db
    .select({ id: schema.cats.id })
    .from(schema.cats)
    .where(eq(schema.cats.orgId, orgId))

  if (existingCatsCount.length >= 35) {
    console.log(`⏭️  Já existem ${existingCatsCount.length} gatos, pulando...`)
  } else {
    // Nomes de gatos variados
    const catNames = [
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
    ]

    const sexOptions = ['male', 'female'] as const
    const testResults = ['positive', 'negative', 'not_tested'] as const
    const statusOptions = ['available', 'in_progress', 'adopted'] as const

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

    const catsToCreate = catNames
      .filter(
        (name) =>
          !existingCatsCount.some((c) => c.id.includes(name.toLowerCase()))
      )
      .slice(0, 35 - existingCatsCount.length)
      .map((name, index) => ({
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
        status: statusOptions[index % 5 === 0 ? 2 : index % 3 === 0 ? 1 : 0]!,
        formId: defaultFormId,
        createdBy: adminUser.id,
      }))

    if (catsToCreate.length > 0) {
      await db.insert(schema.cats).values(catsToCreate)
      console.log(`✅ ${catsToCreate.length} gatos criados`)
    }
  }

  const catsWithoutForm = await db
    .select({ id: schema.cats.id })
    .from(schema.cats)
    .where(
      and(
        eq(schema.cats.orgId, orgId),
        sql`${schema.cats.formId} is null`
      )
    )

  if (catsWithoutForm.length > 0) {
    await db
      .update(schema.cats)
      .set({ formId: defaultFormId })
      .where(
        and(
          eq(schema.cats.orgId, orgId),
          sql`${schema.cats.formId} is null`
        )
      )
    console.log(`✅ ${catsWithoutForm.length} gatos vinculados ao formulário padrão`)
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
