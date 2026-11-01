# GameScore: una sola imagen con la API (ASP.NET Core) y la página (React) servida por la API.
# Funciona en Vercel (Container), Render (Docker) o cualquier hosting con Docker.

# ---------- 1. Compilar la página React ----------
FROM node:22-alpine AS web
WORKDIR /web
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- 2. Compilar la API ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
COPY src/GameScore.Api/GameScore.Api.csproj src/GameScore.Api/
RUN dotnet restore src/GameScore.Api/GameScore.Api.csproj
COPY src/ src/
RUN dotnet publish src/GameScore.Api/GameScore.Api.csproj -c Release -o /app --no-restore

# ---------- 3. Imagen final (solo el runtime) ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=api /app ./
COPY --from=web /web/dist ./wwwroot

# El hosting pone HTTPS delante; esto hace que la API vea la IP y el protocolo reales del visitante.
# PORT (si el hosting lo define) tiene prioridad sobre 8080.
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_FORWARDEDHEADERS_ENABLED=true \
    ASPNETCORE_HTTP_PORTS=8080

EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "GameScore.Api.dll"]
