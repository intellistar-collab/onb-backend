# Build stage
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
# Disable husky in Docker build
ENV HUSKY=0
RUN npm ci --ignore-scripts

# Copy the rest of the application files into the container
COPY . .

# Build the NestJS application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies (disable husky and other scripts)
ENV HUSKY=0
ENV NODE_ENV=production
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy the built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the application port (ensure this matches your application port)
EXPOSE 8000

# Set environment variables (optional, if you need specific ones in production)
ENV NODE_ENV=production
ENV PORT=8000

# Run the application
CMD ["npm", "run", "start:prod"]
