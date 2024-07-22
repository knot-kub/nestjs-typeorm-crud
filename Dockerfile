FROM node:22-alpine as development
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .

EXPOSE 3000