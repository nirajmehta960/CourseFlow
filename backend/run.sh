#!/bin/bash

# Set JAVA_HOME to Java 21
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run Spring Boot application
mvn spring-boot:run

