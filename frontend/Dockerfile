# =============================================================================
# CRM AI Frontend - Dockerfile (Multi-stage)
# =============================================================================
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances pour bénéficier du cache Docker
COPY package*.json .
RUN npm ci && npm cache clean --force

# Copier le reste du code source
COPY . .
RUN npm run build

# =============================================================================
# Runtime stage - Nginx
FROM nginx:alpine

# Copier les fichiers statiques buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sécurité : retirer les binaires inutiles
RUN rm -f /usr/sbin/policy-rc.d /etc/init.d/* /lib/systemd/system/* 2>/dev/null || true

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
