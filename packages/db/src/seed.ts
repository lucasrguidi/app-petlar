import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

dotenv.config({ path: "../../apps/web/.env" });

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle({ client, schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Criar org de teste
  const orgId = crypto.randomUUID();
  await db.insert(schema.orgs).values({
    id: orgId,
    name: "PetLar",
    slug: "petlar",
    logoUrl: null,
  });

  console.log(`✅ Org criada: PetLar (id: ${orgId})`);
  console.log("🌱 Seed concluído!");
}

seed()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
