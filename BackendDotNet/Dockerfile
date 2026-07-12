# =============================================================================
# CRM AI Backend - Dockerfile (Multi-stage)
# =============================================================================
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copier uniquement le .csproj pour bénéficier du cache Docker
COPY src/CrmApi/CrmApi.csproj .
RUN dotnet restore

# Copier le reste du code source
COPY src/CrmApi/ .
RUN dotnet publish -c Release -o /app

# =============================================================================
# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Installer curl pour les healthchecks
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "CrmApi.dll"]
