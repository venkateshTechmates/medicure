FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src
COPY ["MedCure.Api.csproj", "./"]
RUN dotnet restore "MedCure.Api.csproj"
COPY . .
RUN dotnet publish "MedCure.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:5050
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5050
COPY --from=build /app/publish .
RUN mkdir -p /data /app/wwwroot/uploads
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5050/api/health || exit 1
ENTRYPOINT ["dotnet", "MedCure.Api.dll"]
