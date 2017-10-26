#!/bin/bash

docker run --rm --name dumb-bot-1 -v $PWD/example_bots:/example_bots -p 4001:8080 -d node:8-alpine node /example_bots/teebot.js 8080
docker run --rm --name dumb-bot-2 -v $PWD/example_bots:/example_bots -p 4002:8080 -d node:8-alpine node /example_bots/teebot.js 8080
docker run --rm --name teebot-1 -v $PWD/example_bots:/example_bots -p 4003:8080 -d node:8-alpine node /example_bots/teebot.js 8080
docker run --rm --name teebot-2 -v $PWD/example_bots:/example_bots -p 4004:8080 -d node:8-alpine node /example_bots/teebot.js 8080
