# Gunakan image Node.js
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json dan install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy semua source code backend
COPY backend .

# Jalankan aplikasi
CMD ["npm", "start"]