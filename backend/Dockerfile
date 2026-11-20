FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY backend/pom.xml backend/
RUN mvn -f backend/pom.xml dependency:go-offline
COPY . .
RUN mvn -f backend/pom.xml clean package -DskipTests

FROM eclipse-temurin:25-jre-jammy
WORKDIR /app
ENV DB_PATH=/app/data/authdb
RUN mkdir -p /app/data && chown -R 10001:10001 /app/data
COPY --from=build --chown=10001:10001 /app/backend/target/*.jar app.jar
USER 10001:10001
EXPOSE 4000
ENTRYPOINT ["java", "-jar", "app.jar"]
