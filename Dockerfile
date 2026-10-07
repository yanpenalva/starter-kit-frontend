# syntax=docker/dockerfile:1.19
ARG NODE_VERSION=26
ARG NGINX_VERSION=1.29

FROM node:${NODE_VERSION}-alpine@sha256:b341ca66519d9a1c25d4e41f254ffb6fe403fc0f9054c62b863f0660dcc1c199 AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:${NGINX_VERSION}-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de AS runtime
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=6 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
