FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install pg node-fetch
COPY rsm-minter.js .
CMD ["node", "rsm-minter.js"]
