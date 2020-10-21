# Copies in our code and runs NPM Install
FROM node:12-alpine AS base
WORKDIR /usr/src/app
COPY ./ .
RUN ["npm", "ci"]

# Starts and Serves Web Page
FROM node:12-alpine
WORKDIR /usr/src/app
COPY --from=base /usr/src/app .
CMD node server.js