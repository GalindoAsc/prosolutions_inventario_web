import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// En desarrollo local usamos localhost, en Docker/producción usa 'db'
const getDatabaseUrl = () => {
  const envUrl = process.env.DATABASE_URL
  if (!envUrl) {
    return 'postgresql://prosolutions:prosolutions123@localhost:5432/prosolutions_db'
  }
  // Para comandos CLI locales, reemplazar 'db' por 'localhost'
  if (process.env.NODE_ENV !== 'production' && envUrl.includes('@db:')) {
    return envUrl.replace('@db:', '@localhost:')
  }
  return envUrl
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url: getDatabaseUrl(),
  },
})
