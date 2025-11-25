# 使用稳定的Node.js基础镜像
FROM node:18-alpine

# 安装必要的依赖包
RUN apk add --no-cache netcat-openbsd

# 设置工作目录
WORKDIR /app

# 先复制package.json（不依赖package-lock.json）
COPY package.json ./

# 安装依赖（使用--legacy-peer-deps并允许npm生成package-lock.json）
RUN npm install --legacy-peer-deps

# 复制所有应用代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 创建启动脚本，等待数据库就绪后运行迁移和启动服务器
RUN echo '#!/bin/sh\n\necho "Waiting for database to be ready..."\n\n# 等待数据库服务可用\nwhile ! nc -z db 5432; do\n  echo "Database not available yet, waiting 3 seconds..."\n  sleep 3\ndone\n\necho "Database is ready!"\n\n# 运行数据库迁移\necho "Running database migrations..."\nnpx prisma migrate dev --name init 2>/dev/null || echo "Migration skipped (maybe already exists)"\n\n# 启动服务器\necho "Starting server..."\nnode server.js' > /app/start.sh

# 使启动脚本可执行
RUN chmod +x /app/start.sh

# 运行启动脚本
CMD ["/app/start.sh"]