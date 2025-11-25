// Prisma 7配置文件
// 使用Prisma 7的正确配置格式
module.exports = {
  schema: './schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL
  },
  migrations: {
    dir: './prisma/migrations'
  }
};
