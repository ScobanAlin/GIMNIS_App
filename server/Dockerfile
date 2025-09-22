FROM node:22
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
ENV DB_USER=ScobanAlin
ENV DB_HOST=localhost
ENV DB_NAME=Gimnis
ENV DB_PASSWORD=alinsc200421
ENV DB_PORT=5432
ENV PORT=8080
EXPOSE $PORT
CMD ["node", "index.js"]