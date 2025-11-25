import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/family_tree_db',
  },
  schema: './schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
})