FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install express cors uuid
COPY rsm-dex.js .
EXPOSE 3031
CMD ["node", "rsm-dex.js"]
