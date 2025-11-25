// 简化的Prisma 7配置文件
// 只包含最基本的配置，避免导入不存在的模块
module.exports = {
  schema: './schema.prisma',
  datasourceUrl: process.env.DATABASE_URL,
  migrations: {
    dir: './prisma/migrations',
  },
};
