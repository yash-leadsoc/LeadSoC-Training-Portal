FROM node:20-bookworm

# Install LibreOffice
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source
COPY . .

ENV NODE_ENV=production

EXPOSE 10000

CMD ["npm", "start"]