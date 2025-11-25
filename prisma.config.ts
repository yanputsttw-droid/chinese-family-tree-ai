// 兼容Prisma 7的配置文件
// @ts-ignore - 忽略prisma模块导入错误，在Docker构建时会正确解析
import { defineConfig } from "prisma";

export default defineConfig({
  schema: 'schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // 使用字符串模板，避免TypeScript找不到process的错误
    url: 'postgresql://family_user:family_password@db:5432/family_tree_db?schema=public',
  },
});
