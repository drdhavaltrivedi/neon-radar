FROM node:20-slim

WORKDIR /app

# Install dependencies strictly
COPY package.json package-lock.json ./
RUN npm cache clean --force
RUN npm install

# Copy all files
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the Node/Express/Socket.io Server
CMD ["npm", "run", "start"]
