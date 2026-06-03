FROM node:22-alpine

WORKDIR /app

# 先複製套件描述檔以利用 layer cache
COPY package.json package-lock.json ./
# tsx 在 devDependencies（本專案無 build 步驟、以 tsx 直跑 TS），故不加 --omit=dev
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
