# Prisma 7 配置说明

## 概述

本项目已升级到 Prisma 7，采用了新的配置方式。与之前的版本不同，Prisma 7 不再在 `schema.prisma` 文件中定义数据库连接 URL，而是使用独立的 `prisma.config.ts` 配置文件。

## 配置文件结构

### prisma.config.ts

这是 Prisma 7 的主要配置文件，位于项目根目录。它包含以下配置：

```typescript
import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/family_tree_db?schema=public',
  },
  schema: './schema.prisma',
  migrations: './prisma/migrations'
})
```

### 配置项说明

1. **datasource.url**: 数据库连接 URL，从环境变量 `DATABASE_URL` 获取，如果没有则使用默认值
2. **schema**: Prisma schema 文件的路径
3. **migrations**: 数据库迁移文件的目录路径

### schema.prisma

在 `schema.prisma` 文件中，我们只保留了 provider 定义：

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model Family {
  // 模型定义...
}

model LinkRequest {
  // 模型定义...
}
```

## 环境变量配置

为了使应用能够连接到数据库，你需要设置 `DATABASE_URL` 环境变量。该变量应该包含以下信息：

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=[SCHEMA]
```

例如：
```
postgresql://family_user:password123@localhost:5432/family_tree_db?schema=public
```

## Prisma Client 初始化

在 Prisma 7 中，Prisma Client 的初始化方式有所变化。我们不再使用 adapter，而是直接通过 `datasources` 选项传递数据库 URL：

```javascript
const prisma = new PrismaClient({ 
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});
```

## 本地开发配置

在本地开发时，你可以通过以下方式设置环境变量：

1. 在项目根目录创建 `.env` 文件
2. 添加以下内容：
   ```
   DATABASE_URL=postgresql://family_user:password123@localhost:5432/family_tree_db?schema=public
   ```

## 部署配置

在部署到 Render 或其他平台时，请确保设置了 `DATABASE_URL` 环境变量，其值应指向你的生产数据库。

## 常见问题

### 为什么不在 schema.prisma 中定义数据库 URL？

从 Prisma 7 开始，出于安全性和配置灵活性的考虑，数据库连接 URL 应该在单独的配置文件中定义，而不是在 schema 文件中。

### 如何验证配置是否正确？

你可以通过运行以下命令来验证配置：

```bash
npx prisma generate
```

如果配置正确，Prisma Client 将成功生成。

### 配置文件中的默认值安全吗？

`prisma.config.ts` 中的默认值仅用于本地开发。在生产环境中，始终应该通过环境变量提供数据库连接 URL。