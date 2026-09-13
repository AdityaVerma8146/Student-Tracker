# Builds the WHOLE app (frontend + backend + AI assistant) into a single
# runnable jar, so it deploys as one service with one URL.
#
# IMPORTANT — this must be built with the REPO ROOT as the Docker build
# context, NOT backend/ — it needs both backend/ and frontend/ present as
# sibling directories (the Maven build in Stage 1 pulls frontend/ in via
# pom.xml's frontend-maven-plugin). On Render: leave "Root Directory" blank
# (repo root) and set "Dockerfile Path" to backend/Dockerfile.

# ---- Stage 1: build ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
COPY frontend frontend
WORKDIR /app/backend
# Downloads its own local Node/npm, builds frontend/, copies the result
# into src/main/resources/static, then packages everything into one jar.
# See the frontend-maven-plugin + maven-resources-plugin executions in
# pom.xml for the details of that.
RUN mvn clean package -DskipTests

# Force npm to ignore native platform binary checks inside the Linux environment
RUN cd ../frontend && npm install --include=optional --os=linux --cpu=x64 --legacy-peer-deps
RUN mvn clean package -DskipTests

# ---- Stage 2: run ----
# Small JRE-only image for the actual running container — the JDK, Maven,
# and Node used to build the jar above aren't needed at runtime.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/backend/target/backend-2.0.0.jar app.jar

# Informational only — Render (and most PaaS hosts) inject their own PORT
# env var and route to whatever port the app actually listens on.
# application.properties already reads it: server.port=${PORT:4000}.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
