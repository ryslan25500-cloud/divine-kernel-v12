FROM node:20-alpine

WORKDIR /app

RUN npm init -y && \
    npm install express body-parser crypto-js uuid ws level

COPY rsm-chain.js .
COPY init.sql /init.sql

EXPOSE 8545 8546

CMD ["node", "rsm-chain.js"]
