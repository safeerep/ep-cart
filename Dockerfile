FROM node:alpine

WORKDIR /app

COPY package.json .

RUN npm install

RUN npm install -g nodemon

COPY . .

EXPOSE 3001

CMD [ "npm", "start" ]