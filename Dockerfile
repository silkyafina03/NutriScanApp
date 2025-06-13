# Gunakan Node.js image resmi
FROM node:18

# Set working directory ke backend
WORKDIR /app

# Copy isi folder backend ke container
COPY backend/package*.json ./
COPY backend/.env .env
COPY backend/src ./src

# Install dependencies
RUN npm install

# Jalankan server
CMD ["node", "src/server.js"]