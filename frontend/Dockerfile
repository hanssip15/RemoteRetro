FROM node:20 AS builder


# install dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Copy all local files into the image.
COPY . .

RUN npm run build

FROM node:20-slim

WORKDIR /app
COPY --from=builder /app .
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start"]
