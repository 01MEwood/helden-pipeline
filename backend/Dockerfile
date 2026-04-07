# Backend: Node + Express + Prisma + PostgreSQL
# helden-pipeline läuft intern auf Port 4100 (MEOS-Konvention zur
# Vermeidung von Verwechslungen — jedes Modul bekommt einen eigenen Port:
# 4100, 4200, 4300, …)
FROM node:20-alpine
WORKDIR /app

# openssl für Prisma Query Engine, curl für Healthcheck
RUN apk add --no-cache curl openssl

# Dependencies installieren (prisma muss vorher da sein für generate)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

# App-Code
COPY . .

ENV PORT=4100
EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4100/health || exit 1

# node direkt (nicht npm start) — korrektes Signal-Handling für SIGTERM
CMD ["node", "index.js"]
