# needed for serve to work
FROM node:8.11.4

# set / create working directory
WORKDIR /app

# Install yarn
RUN apt-get update && apt-get install -y apt-transport-https
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install yarn

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# needed for build script to work
COPY . .
RUN yarn install
RUN yarn run build

EXPOSE 3000

CMD ["yarn", "start"]