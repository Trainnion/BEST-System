# BEST-SYSTEM application image (docs/implementation-plan.md Sec. 6.2).
# Multi-stage Node 20 Alpine. Prisma engines and the Prisma CLI are baked in so
# `prisma migrate deploy` works with no internet (air-gapped install, Sec. 7.7).

FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

FROM base AS build
ARG BUILD_STANDALONE=1
ENV BUILD_STANDALONE=$BUILD_STANDALONE NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# postbuild runs scripts/gen-precache.js (WP-09)
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
# SEED-01: demo data never ships in production images; --build-arg INCLUDE_DEMO=1
# is for the test image only (Sec. 16.1).
ARG INCLUDE_DEMO=0
RUN if [ "$INCLUDE_DEMO" != "1" ]; then rm -f prisma/seed.demo.js; fi
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x scripts/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
