#!/bin/sh

# 设置错误时退出
set -e

# 打印当前目录和环境信息
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."

# 确保配置文件存在
echo "=== Checking configuration files ==="
ls -la prisma.config.ts schema.prisma
ls -la

# 运行数据库迁移
echo "=== Running database migrations ==="
./node_modules/.bin/prisma migrate deploy

# 启动服务器
echo "=== Starting server ==="
node server.js
