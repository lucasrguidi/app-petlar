import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { Scrypt } from 'oslo/password'

import { buildOrgScopedAuthEmail, normalizeUserEmail } from './auth-identity'
import * as schema from './schema'

dotenv.config({ path: '../../apps/web/.env' })

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const db = drizzle({ client, schema })

function buildCatPhotoUrl(seed: number): string {
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

async function seedPreview() {
  console.log('🌱 Seeding preview database for Quero Adotar...')

  // Check if org already exists
  const existingOrg = await db.query.orgs.findFirst({
    where: (orgs, { eq }) => eq(orgs.slug, 'queroadotar'),
  })

  let orgId: string

  if (existingOrg) {
    console.log(`⏭️  Org já existe: Quero Adotar (id: ${existingOrg.id})`)
    orgId = existingOrg.id
  } else {
    orgId = crypto.randomUUID()
    await db.insert(schema.orgs).values({
      id: orgId,
      name: 'Quero Adotar',
      slug: 'queroadotar',
      logoUrl: null,
    })
    console.log(`✅ Org criada: Quero Adotar (id: ${orgId})`)
  }

  // Create admin user
  const defaultPassword = '123456'
  const adminEmail = 'queroadotar@admin.com'
  const normalizedAdminEmail = normalizeUserEmail(adminEmail)
  const authEmail = buildOrgScopedAuthEmail({
    orgId,
    email: normalizedAdminEmail,
  })

  const scrypt = new Scrypt()
  const hashedPassword = await scrypt.hash(defaultPassword)
  const now = new Date()

  const existingAdmin = await db.query.user.findFirst({
    where: (users, { and, eq }) =>
      and(
        eq(users.orgId, orgId),
        eq(users.contactEmailNormalized, normalizedAdminEmail)
      ),
  })

  let adminUserId: string

  if (existingAdmin) {
    adminUserId = existingAdmin.id
    await db
      .update(schema.user)
      .set({
        name: 'Admin Quero Adotar',
        email: authEmail,
        contactEmail: normalizedAdminEmail,
        contactEmailNormalized: normalizedAdminEmail,
        emailVerified: true,
        orgId,
        role: 'admin',
        active: true,
        lastSeenAt: now,
        lastLoginAt: now,
      })
      .where(eq(schema.user.id, existingAdmin.id))
    console.log(`⏭️  Admin atualizado: ${adminEmail}`)
  } else {
    adminUserId = crypto.randomUUID()
    await db.insert(schema.user).values({
      id: adminUserId,
      name: 'Admin Quero Adotar',
      email: authEmail,
      contactEmail: normalizedAdminEmail,
      contactEmailNormalized: normalizedAdminEmail,
      emailVerified: true,
      orgId,
      role: 'admin',
      active: true,
      lastSeenAt: now,
      lastLoginAt: now,
    })
    console.log(`✅ Admin criado: ${adminEmail}`)
  }

  // Ensure credential account exists
  const existingAccount = await db.query.account.findFirst({
    where: (accounts, { and, eq }) =>
      and(eq(accounts.userId, adminUserId), eq(accounts.providerId, 'credential')),
  })

  if (!existingAccount) {
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: adminUserId,
      providerId: 'credential',
      userId: adminUserId,
      password: hashedPassword,
    })
    console.log(`✅ Conta credential criada para admin`)
  }

  console.log(`🔑 Login: ${adminEmail} / ${defaultPassword}`)

  // Create invites for Lucas and Laura
  await db.delete(schema.invites).where(eq(schema.invites.orgId, orgId))

  const HOUR_MS = 60 * 60 * 1000
  const invites = [
    { email: 'lucasrguidi@gmail.com', name: 'Lucas Guidi' },
    { email: 'lauracoan.contato@gmail.com', name: 'Laura Coan' },
  ]

  const invitesToCreate = invites.map((invite, index) => ({
    id: crypto.randomUUID(),
    orgId,
    email: invite.email,
    role: 'admin' as const,
    token: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 48 * HOUR_MS),
    usedAt: null,
    invitedById: adminUserId,
    createdAt: new Date(Date.now() - index * HOUR_MS),
  }))

  await db.insert(schema.invites).values(invitesToCreate)
  console.log(`✅ ${invitesToCreate.length} convites criados`)

  // Create adoption form with 7 fields
  const formName = 'Formulário de Adoção'
  let formId: string

  const existingForm = await db.query.forms.findFirst({
    where: (forms, { and, eq }) =>
      and(eq(forms.orgId, orgId), eq(forms.name, formName)),
  })

  if (existingForm) {
    formId = existingForm.id
    console.log(`⏭️  Formulário já existe (id: ${formId})`)
  } else {
    formId = crypto.randomUUID()
    await db.insert(schema.forms).values({
      id: formId,
      orgId,
      name: formName,
      description: 'Formulário padrão para candidatura de adoção.',
      active: true,
    })
    console.log(`✅ Formulário criado (id: ${formId})`)
  }

  // Delete existing fields to recreate
  await db
    .delete(schema.formFields)
    .where(eq(schema.formFields.formId, formId))

  // Create form fields according to the plan
  const housingFieldId = crypto.randomUUID()
  const hasOtherAnimalsFieldId = crypto.randomUUID()

  const formFieldsToCreate = [
    {
      id: housingFieldId,
      formId,
      order: 1,
      type: 'select' as const,
      label: 'Tipo de moradia',
      required: true,
      helpText: 'Selecione onde você mora.',
      options: ['Casa', 'Apartamento'],
      condition: null,
      mediaConfig: null,
    },
    {
      id: crypto.randomUUID(),
      formId,
      order: 2,
      type: 'media' as const,
      label: 'Envie um vídeo mostrando as telas das janelas',
      required: true,
      helpText: 'Para apartamentos, precisamos verificar a segurança das janelas.',
      options: null,
      condition: {
        fieldId: housingFieldId,
        operator: 'equals' as const,
        value: 'Apartamento',
      },
      mediaConfig: { kind: 'video' as const },
    },
    {
      id: hasOtherAnimalsFieldId,
      formId,
      order: 3,
      type: 'boolean' as const,
      label: 'Possui outros animais?',
      required: true,
      helpText: null,
      options: null,
      condition: null,
      mediaConfig: null,
    },
    {
      id: crypto.randomUUID(),
      formId,
      order: 4,
      type: 'select' as const,
      label: 'Quantos animais você possui?',
      required: true,
      helpText: null,
      options: ['1', '2', '3+'],
      condition: {
        fieldId: hasOtherAnimalsFieldId,
        operator: 'equals' as const,
        value: true,
      },
      mediaConfig: null,
    },
    {
      id: crypto.randomUUID(),
      formId,
      order: 5,
      type: 'text' as const,
      label: 'Quais animais você possui?',
      required: true,
      helpText: 'Ex: 2 gatos e 1 cachorro',
      options: null,
      condition: {
        fieldId: hasOtherAnimalsFieldId,
        operator: 'equals' as const,
        value: true,
      },
      mediaConfig: null,
    },
    {
      id: crypto.randomUUID(),
      formId,
      order: 6,
      type: 'textarea' as const,
      label: 'Rotina e tempo em casa',
      required: true,
      helpText: 'Descreva sua rotina diária e quanto tempo você fica em casa.',
      options: null,
      condition: null,
      mediaConfig: null,
    },
    {
      id: crypto.randomUUID(),
      formId,
      order: 7,
      type: 'boolean' as const,
      label: 'Já teve experiência como tutor de animais?',
      required: true,
      helpText: null,
      options: null,
      condition: null,
      mediaConfig: null,
    },
  ]

  await db.insert(schema.formFields).values(formFieldsToCreate)
  console.log(`✅ ${formFieldsToCreate.length} campos de formulário criados`)

  const formSnapshot = await buildFormSnapshot(formId)

  // Delete existing cats for this org to recreate with correct distribution
  const existingCats = await db
    .select({ id: schema.cats.id })
    .from(schema.cats)
    .where(eq(schema.cats.orgId, orgId))

  if (existingCats.length > 0) {
    // Delete photos first (FK constraint)
    for (const cat of existingCats) {
      await db
        .delete(schema.catPhotos)
        .where(eq(schema.catPhotos.catId, cat.id))
    }
    // Delete adoptions
    await db.delete(schema.adoptions).where(eq(schema.adoptions.orgId, orgId))
    // Delete applications
    await db.delete(schema.applications).where(eq(schema.applications.orgId, orgId))
    // Delete cats
    await db.delete(schema.cats).where(eq(schema.cats.orgId, orgId))
    console.log(`🗑️  ${existingCats.length} gatos antigos removidos`)
  }

  // Cat names (40 cats)
  const catNames = [
    'Luna', 'Simba', 'Mimi', 'Thor', 'Mel', 'Felix', 'Nina', 'Tom',
    'Frida', 'Garfield', 'Belinha', 'Whiskers', 'Pipoca', 'Frajola',
    'Mingau', 'Biscuit', 'Pantera', 'Flor', 'Tigre', 'Amora',
    'Bob', 'Sushi', 'Bolinha', 'Chico', 'Marley', 'Nala', 'Oliver',
    'Pituca', 'Romeo', 'Salém', 'Toddy', 'Zoe', 'Apolo', 'Cacau',
    'Duque', 'Mia', 'Leo', 'Cleo', 'Max', 'Lila',
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

  // Distribution: 20 available, 10 in_progress, 10 adopted
  const getStatus = (index: number): 'available' | 'in_progress' | 'adopted' => {
    if (index < 20) return 'available'
    if (index < 30) return 'in_progress'
    return 'adopted'
  }

  const catsToCreate = catNames.map((name, index) => ({
    id: crypto.randomUUID(),
    orgId,
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
    formId,
    formSnapshot,
    createdBy: adminUserId,
  }))

  await db.insert(schema.cats).values(catsToCreate)
  console.log(`✅ ${catsToCreate.length} gatos criados (20 available, 10 in_progress, 10 adopted)`)

  // Add photos for each cat
  const photosToInsert = catsToCreate.flatMap((cat, index) => {
    const photoCount = index % 3 === 0 ? 3 : index % 2 === 0 ? 2 : 1
    return Array.from({ length: photoCount }, (_, photoIndex) => ({
      id: crypto.randomUUID(),
      catId: cat.id,
      order: photoIndex + 1,
      url: buildCatPhotoUrl((index + 1) * 10 + photoIndex + 1),
    }))
  })

  await db.insert(schema.catPhotos).values(photosToInsert)
  console.log(`✅ ${photosToInsert.length} fotos criadas`)

  // Create adoptions for the last 10 cats (adopted status)
  const adoptedCats = catsToCreate.filter((cat) => cat.status === 'adopted')

  const adopterFirstNames = [
    'Maria', 'José', 'Ana', 'Paulo', 'Fernanda',
    'Carlos', 'Juliana', 'Roberto', 'Patricia', 'Lucas',
  ]

  const adopterLastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues',
    'Ferreira', 'Almeida', 'Costa', 'Gomes', 'Martins',
  ]

  // Distribute adoptions over 12 months
  const adoptionsToInsert = adoptedCats.map((cat, index) => {
    const firstName = adopterFirstNames[index % adopterFirstNames.length]!
    const lastName = adopterLastNames[index % adopterLastNames.length]!
    const adopterName = `${firstName} ${lastName}`
    const adopterNameNormalized = normalizeNameForSearch(adopterName)

    // Distribute evenly across 12 months
    const monthsAgo = index + 1
    const adoptionDate = new Date()
    adoptionDate.setMonth(adoptionDate.getMonth() - monthsAgo)
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
      notes: index % 2 === 0
        ? `Adoção realizada com sucesso. ${cat.name} está muito feliz!`
        : null,
      createdBy: adminUserId,
    }
  })

  await db.insert(schema.adoptions).values(adoptionsToInsert)
  console.log(`✅ ${adoptionsToInsert.length} adoções criadas (distribuídas em 12 meses)`)

  // Create applications for available and in_progress cats (2-5 per cat)
  const catsForApplications = catsToCreate.filter(
    (cat) => cat.status === 'available' || cat.status === 'in_progress'
  )

  const candidatesFirstNames = [
    'Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda',
    'Felipe', 'Giovana', 'Henrique', 'Isabela', 'João',
    'Karina', 'Luís', 'Marina', 'Nicolas', 'Otávio',
    'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vitória',
  ]

  const candidatesLastNames = [
    'Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira',
    'Costa', 'Almeida', 'Rodrigues', 'Ferreira', 'Gomes',
  ]

  const applicationsToInsert: Array<typeof schema.applications.$inferInsert> = []
  let globalCandidateIndex = 0

  for (const [catIndex, cat] of catsForApplications.entries()) {
    const applicationsCount = randomInt(2, 5)

    for (let appIndex = 0; appIndex < applicationsCount; appIndex++) {
      globalCandidateIndex += 1

      const firstName = candidatesFirstNames[globalCandidateIndex % candidatesFirstNames.length]!
      const lastName = candidatesLastNames[globalCandidateIndex % candidatesLastNames.length]!
      const applicantName = `${firstName} ${lastName}`
      const applicantNameNormalized = normalizeNameForSearch(applicantName)
      const applicantEmail = `candidato+${catIndex + 1}-${appIndex + 1}@queroadotar.dev`
      const applicantWhatsapp = `119${String(80000000 + globalCandidateIndex).slice(0, 8)}`
      const createdAt = new Date(
        Date.now() - (catIndex * 5 + appIndex + 1) * 6 * 60 * 60 * 1000
      )
      const confirmedAt = new Date(createdAt.getTime() + 10 * 60 * 1000)

      // Build responses for the form
      const responses: Record<string, string | boolean | null> = {}

      for (const field of formSnapshot) {
        if (field.condition) {
          const parentValue = responses[field.condition.fieldId]
          if (parentValue !== field.condition.value) {
            continue
          }
        }

        if (field.type === 'select') {
          const options = field.options ?? []
          responses[field.id] = options.length > 0
            ? options[(globalCandidateIndex + field.order) % options.length]!
            : null
          continue
        }

        if (field.type === 'boolean') {
          responses[field.id] = (globalCandidateIndex + field.order) % 2 === 0
          continue
        }

        if (field.type === 'textarea') {
          responses[field.id] =
            `Tenho rotina estável e experiência com animais. Candidatura ${globalCandidateIndex}.`
          continue
        }

        if (field.type === 'media') {
          // Skip media fields for seed - they would need actual files
          responses[field.id] = null
          continue
        }

        responses[field.id] = `Resposta ${globalCandidateIndex} - ${field.label}`
      }

      applicationsToInsert.push({
        id: crypto.randomUUID(),
        orgId,
        catId: cat.id,
        formId,
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
    }
  }

  await db.insert(schema.applications).values(applicationsToInsert)
  console.log(`✅ ${applicationsToInsert.length} candidaturas criadas (todas pending)`)

  console.log('')
  console.log('🌱 Seed preview concluído!')
  console.log('')
  console.log('📊 Resumo:')
  console.log(`   - Org: Quero Adotar (slug: queroadotar)`)
  console.log(`   - Admin: ${adminEmail} / ${defaultPassword}`)
  console.log(`   - Convites: ${invitesToCreate.length}`)
  console.log(`   - Formulário: ${formFieldsToCreate.length} campos`)
  console.log(`   - Gatos: ${catsToCreate.length} (20 available, 10 in_progress, 10 adopted)`)
  console.log(`   - Adoções: ${adoptionsToInsert.length}`)
  console.log(`   - Candidaturas: ${applicationsToInsert.length}`)
}

seedPreview()
  .catch((error) => {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
