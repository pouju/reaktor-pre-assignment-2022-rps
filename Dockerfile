FROM node:16-alpine

WORKDIR /usr/src/app
COPY rps-backend ./rps-backend
COPY rps-frontend ./rps-frontend
COPY package.json .

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]