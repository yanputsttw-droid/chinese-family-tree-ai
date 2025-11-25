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

# 安装Prisma CLI
RUN npm install -g prisma

# 复制所有应用代码
COPY . .

# 生成Prisma客户端
RUN prisma generate

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