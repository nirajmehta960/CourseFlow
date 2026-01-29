FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl ca-certificates
WORKDIR /app
# We now build the JAR on the GitHub runner for speed
COPY target/*.jar app.jar
EXPOSE 4000
ENTRYPOINT ["java", "-jar", "app.jar"]

