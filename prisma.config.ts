// 兼容Prisma 7的配置文件
require('dotenv').config();
module.exports = {
  schema: 'schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
};

