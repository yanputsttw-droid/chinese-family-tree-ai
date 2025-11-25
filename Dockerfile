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

# 复制Prisma配置文件
COPY prisma.config.ts ./
COPY schema.prisma ./
COPY prisma/ ./prisma/

# 生成Prisma客户端（使用npx确保使用项目本地安装的prisma）
RUN npx prisma generate

# 复制所有应用代码（不包括已经复制的配置文件）
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 复制启动脚本
COPY start-render.sh /app/start.sh

# 使启动脚本可执行
RUN chmod +x /app/start.sh

# 运行启动脚本
CMD ["/app/start.sh"]