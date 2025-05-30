# ----------- Stage 1: Build ----------- #
FROM node:22.12.0-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build the app
RUN npm run build


# ----------- Stage 2: Serve ----------- #
FROM node:22.12.0-alpine

# Install lightweight static file server
RUN npm install -g serve

# Copy built assets from builder stage
WORKDIR /app
COPY --from=builder /app/build ./build

# Expose the port used by `serve`
EXPOSE 3000

# Start the static server
CMD ["serve", "-s", "build", "-l", "3000"]

