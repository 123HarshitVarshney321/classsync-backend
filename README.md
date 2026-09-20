# ClassSync Backend

ClassSync is a smart classroom and lecture-hall scheduling and allocation backend built with Java 21 and Spring Boot 3.

## Prerequisites

- **Java**: 21 or newer (`java -version`)
- **Maven**: 3.9+ (`mvn -version`)

## Architecture & Design Principles

The backend follows a layered monolithic architecture:

```
Controller  -->  Service  -->  Repository  -->  MySQL
```

At this initial foundation stage:
- Only necessary packages and classes are present (KISS, YAGNI, Ponytail minimal principles).
- No premature abstractions, empty interfaces, or unused utility classes.
- Database properties are configured to accept environment variables with sensible defaults.
- Database entities, tables, JPA, and Redis connections are deferred to subsequent feature phases.

## Project Structure

```
classsync-backend/
├── pom.xml
├── .gitignore
├── README.md
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/
    │   │       └── classsync/
    │   │           ├── ClassSyncApplication.java
    │   │           ├── controller/
    │   │           │   └── HealthController.java
    │   │           └── dto/
    │   │               └── HealthResponse.java
    │   └── resources/
    │       └── application.yml
    └── test/
        └── java/
            └── com/
                └── classsync/
                    ├── ClassSyncApplicationTests.java
                    └── controller/
                        └── HealthControllerTest.java
```

## Configuration

Configuration is managed in `src/main/resources/application.yml`. Database credentials and server port can be supplied through environment variables:

| Environment Variable | Description | Default Value |
|----------------------|-------------|---------------|
| `PORT`               | HTTP server port | `8080` |
| `DB_URL`             | MySQL JDBC URL | `jdbc:mysql://localhost:3306/classsync?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DB_USERNAME`        | MySQL user | `root` |
| `DB_PASSWORD`        | MySQL password | (empty) |

No secrets are hardcoded.

## How to Run the Backend

To run the application using Maven:

```bash
mvn spring-boot:run
```

Or build and run the packaged JAR:

```bash
mvn clean package
java -jar target/classsync-backend-0.0.1-SNAPSHOT.jar
```

## Health Endpoint

- **Endpoint**: `GET /api/health`
- **Method**: `GET`
- **Response**: `200 OK`
- **Content-Type**: `application/json`

**Example Response:**
```json
{
  "status": "UP",
  "service": "ClassSync Backend"
}
```

Verify with `curl`:
```bash
curl http://localhost:8080/api/health
```

## Testing

Run all unit and integration slice tests:

```bash
mvn test
```

Run a complete build and verification:

```bash
mvn clean verify
```
