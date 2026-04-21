FROM node:20-alpine AS base
WORKDIR /app

# NPM_TOKEN injected at build time by Railway (set as a build-time env var).
# The project-level .npmrc interpolates ${NPM_TOKEN}, so passing it via ARG→ENV
# at build time lets `npm ci` auth against npm.pkg.github.com without baking
# the secret into a layer.
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

COPY package.json package-lock.json* .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Scrub the token before creating any further layers that could carry it.
RUN unset NPM_TOKEN && sed -i 's|\${NPM_TOKEN}|REDACTED|' .npmrc

FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
