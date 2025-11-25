const { PrismaClient } = require('@prisma/client');
const { PrismaAdapterPg } = require('@prisma/adapter-pg');
const pg = require('pg');

// 创建PostgreSQL连接池
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// 创建适配器
const adapter = new PrismaAdapterPg(pool);

// 导出Prisma 7配置
module.exports = {
  schema: './schema.prisma',
  datasourceUrl: process.env.DATABASE_URL,
  migrations: {
    dir: './prisma/migrations',
  },
};
