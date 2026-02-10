import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { Scrypt } from 'oslo/password'

import * as schema from './schema'

dotenv.config({ path: '../../apps/web/.env' })

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const db = drizzle({ client, schema })

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
        sex: sexOptions[index % 2],
        fiv: testResults[index % 3],
        felv: testResults[(index + 1) % 3],
        castrated: index % 3 !== 0,
        vaccinated: index % 4 !== 0,
        vaccinationNotes: index % 4 !== 0 ? 'Vacinas em dia' : null,
        dewormed: index % 2 === 0,
        dewormingNotes: null,
        description: descriptions[index % descriptions.length],
        status: statusOptions[index % 5 === 0 ? 2 : index % 3 === 0 ? 1 : 0],
        createdBy: adminUser.id,
      }))

    if (catsToCreate.length > 0) {
      await db.insert(schema.cats).values(catsToCreate)
      console.log(`✅ ${catsToCreate.length} gatos criados`)
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
