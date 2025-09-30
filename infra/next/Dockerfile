FROM node:18-bullseye

WORKDIR /usr/src/app

# Install pnpm if needed
RUN npm install -g pnpm@latest

COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
