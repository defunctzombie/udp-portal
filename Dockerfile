FROM node:0.10.33
MAINTAINER Roman Shtylman <shtylman@gmail.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD package.json /usr/src/app/
RUN npm install --production

ADD . /usr/src/app

ENTRYPOINT ["bin/udp-portal"]
