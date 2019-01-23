# needed for serve to work
FROM node:8.11.4

# set / create working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# needed for build script to work
COPY . .
RUN yarn install
RUN yarn run build

EXPOSE 3000

CMD ["yarn", "run", "build:prod"]