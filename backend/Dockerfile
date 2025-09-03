FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

#COPY --from=builder /app .
COPY --from=builder /app/dist ./dist

#CMD ["npm", "run", "start:prod"]
CMD ["node", "dist/main.js"]
