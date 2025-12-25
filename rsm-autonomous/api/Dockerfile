FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install express cors
COPY rsm-api.js .
EXPOSE 3030
CMD ["node", "rsm-api.js"]
