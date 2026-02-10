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
