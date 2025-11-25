# 使用兼容Prisma的Node.js基础镜像
FROM node:20-alpine

# 安装必要的依赖包
RUN apk add --no-cache netcat-openbsd openssl python3 make g++

# 设置工作目录
WORKDIR /app

# 先复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（使用--legacy-peer-deps）
RUN npm install --legacy-peer-deps

# 复制所有应用代码
COPY . .

# 调试：检查文件是否正确复制
RUN ls -la /app
RUN echo "=== Checking start-render.sh exists and has correct permissions ==="
RUN if [ -f /app/start-render.sh ]; then echo "start-render.sh exists"; else echo "ERROR: start-render.sh NOT FOUND"; fi
RUN cat /app/start-render.sh

# 生成Prisma客户端（使用npx确保使用项目本地安装的prisma）
RUN npx prisma generate

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 确保启动脚本存在并可执行
RUN chmod +x /app/start-render.sh

# 运行启动脚本
CMD ["/app/start-render.sh"]