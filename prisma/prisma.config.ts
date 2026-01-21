import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),

  migrations: {
    path: path.join(__dirname, 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url: 'postgresql://prosolutions:prosolutions123@localhost:5432/prosolutions_db',
  },
})
