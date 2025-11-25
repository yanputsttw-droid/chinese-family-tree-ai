# 使用稳定的Node.js基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 先复制package.json（不依赖package-lock.json）
COPY package.json ./

# 安装依赖（使用--legacy-peer-deps并允许npm生成package-lock.json）
RUN npm install --legacy-peer-deps

# 复制所有应用代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 运行服务器
CMD ["node", "server.js"]