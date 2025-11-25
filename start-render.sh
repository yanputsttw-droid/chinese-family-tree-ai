#!/bin/bash

# 设置错误时退出
set -e

# 打印当前目录和环境信息
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# 运行数据库迁移
echo "=== Running database migrations ==="
npx prisma migrate deploy

# 启动服务器
echo "=== Starting server ==="
node server.js
