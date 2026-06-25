FROM node:24-alpine AS deps
RUN apk add --no-cache yt-dlp ffmpeg python3 py3-pip
RUN pip3 install spotdl --no-cache-dir
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS runner
RUN apk add --no-cache yt-dlp ffmpeg python3 tini
COPY --from=deps /usr/lib/python3* /usr/lib/
COPY --from=deps /usr/bin/spotdl /usr/bin/spotdl
ENV SPOTDL_BIN=spotdl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build
USER node
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node_modules/.bin/next", "start"]
