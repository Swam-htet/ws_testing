# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files first
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p src/public src/routes src/config src/services src/models uploads

# Copy source files
COPY src/ src/
COPY .env* ./

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files first
COPY package.json ./
COPY package-lock.json* ./

# Install production dependencies
RUN npm install --only=production

# Create necessary directories
RUN mkdir -p src/public src/routes src/config src/services src/models uploads

# Copy source files
COPY src/ src/
COPY .env* ./

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"] 