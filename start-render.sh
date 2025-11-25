#!/bin/sh

# 设置错误时退出
set -e

# 打印当前目录和环境信息
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "DATABASE_URL is set (first 50 chars): ${DATABASE_URL:0:50}..."

# 确保Prisma客户端已生成
echo "=== Generating Prisma Client ==="
npx prisma generate

# 显示Prisma状态
echo "=== Prisma Status ==="
npx prisma studio &

# 运行数据库迁移
echo "=== Running database migrations ==="
npx prisma migrate deploy

# 构建应用
echo "=== Building application ==="
npm run build

# 启动服务器
echo "=== Starting server ==="
node server.js