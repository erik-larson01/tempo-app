# Deadline Manager API (Old README - July 2025)

[![Java](https://img.shields.io/badge/Java-17-blue)](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.3-green)](https://spring.io/projects/spring-boot)
![Last Commit](https://img.shields.io/github/last-commit/erik-larson01/deadline-manager-api/main)

Deadline Manager is a RESTful API and backend system built with Java, Spring Boot, Spring Data JPA, and PostgreSQL, designed to help students and professionals efficiently manage both academic and personal deadlines. 

At its core, the application enables users to define high-level projects and decompose them into smaller, actionable tasks with their own due dates, estimated effort, and difficulty ratings.

By offering structured support for both project-level planning and task-level execution, this API encourages users to focus on what matters most and stay organized under time pressure.
## Table of Contents
- [Motivation](#motivation)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [File Structure](#file-structure)
- [Getting Started](#getting-started)
- [Example Queries](#example-queries)
- [Future Improvements](#future-improvements)

## Motivation
This project began with a question I asked myself during my programming coursework at UW–Madison:
*“I’ve been learning Java, but how can I apply it to build something meaningful and relevant outside the classroom?”*

That question led me to explore real-world backend development using Spring Boot, a powerful Java framework for building scalable APIs and web applications. I wanted to create something technically challenging that also addressed a problem students often face: managing complex academic workloads.

After considering several ideas, I decided to build an API that helps students manage project deadlines more effectively. The goal was to design a tool that could organize high-level projects while breaking them down into smaller, manageable tasks. In my own experience, this kind of structure improves productivity, reduces procrastination, and makes it easier to maintain momentum throughout the semester.

I'm proud of what this project has become and look forward to expanding it into a full application with a user-friendly frontend in the future.

## Features

- Create, read, update, and delete (CRUD) operations for both Projects and Tasks.

- Automatic priority scoring algorithm for projects based on due date, difficulty, and weight.

- Task status management with enum-based validation.

- Filtering and querying projects and tasks by status, due dates, and priorities.

- Consistent global exception handling with meaningful HTTP responses.

- Clean layered architecture separating controller, service, and repository layers.

## Tech Stack

- Java 17
- Spring Boot
- Spring Data JPA
- PostgreSQL
- Jakarta Validation

## API Endpoints

| HTTP Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/api/v1/projects` | Create a new project |
| **GET** | `/api/v1/projects/{id}` | Get a project by ID |
| **PUT** | `/api/v1/projects/{id}` | Update an existing project |
| **PATCH** | `/api/v1/projects/{id}/status` | Update project status |
| **GET** | `/api/v1/projects` | Get all projects |
| **GET** | `/api/v1/projects/course/{course}` | Get projects filtered by course |
| **GET** | `/api/v1/projects/status` | Get projects filtered by status (query param) |
| **GET** | `/api/v1/projects/due-in` | Get projects due within X days (query param) |
| **GET** | `/api/v1/projects/completed` | Get all completed projects |
| **GET** | `/api/v1/projects/priority` | Get projects sorted by priority |
| **PATCH** | `/api/v1/projects/update-priorities` | Update priorities for all projects |
| **DELETE** | `/api/v1/projects/{id}` | Delete a project |
| **POST** | `/api/v1/projects/{projectId}/tasks` | Create a new task in a project |
| **GET** | `/api/v1/projects/{projectId}/tasks/{taskId}` | Get a specific task by ID within a project |
| **PUT** | `/api/v1/projects/{projectId}/tasks/{taskId}` | Update an existing task |
| **PATCH** | `/api/v1/projects/{projectId}/tasks/{taskId}/status` | Update status of a task |
| **GET** | `/api/v1/tasks` | Get all tasks |
| **GET** | `/api/v1/projects/{projectId}/tasks` | Get all tasks for a specific project |
| **GET** | `/api/v1/tasks/status` | Get tasks filtered by status (query param) |
| **GET** | `/api/v1/projects/{projectId}/tasks/incomplete` | Get incomplete tasks for a project |
| **DELETE** | `/api/v1/projects/{projectId}/tasks/{taskId}` | Delete a task |

## File Structure
The tool uses and creates the following directory structure:
```
deadline-manager/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/erikmlarson5/deadlinemanager/
│       │       ├── controller/        # REST controllers for API endpoints
│       │       ├── dto/               # Data Transfer Objects (input/output)
│       │       ├── entity/            # JPA entities mapped to PostgresSQL database tables
│       │       ├── exception/         # Global exception handling
│       │       ├── repository/        # Spring Data JPA repositories
│       │       ├── service/           # Business logic layer
│       │       ├── utils/             # Enums and utility classes
│       │       └── DeadlineManagerApplication.java  # Spring Boot main application
│       └── resources/
│           └── application.properties  # Configuration (DB, app settings)
├── .gitignore
├── mvnw
├── mvnw.cmd
├── pom.xml                          # Maven dependencies and build config
└── README.md
```

## Getting Started

### Prerequisites

-   Java 17+

-   [Maven](https://maven.apache.org/install.html)

-   [PostgreSQL](https://www.postgresql.org/download/)

### 1\. Clone the repository

```bash
git clone https://github.com/erik-larson01/deadline-manager-api.git
cd deadline-manager-api
```

### 2\. Set Up the Database

1.  Start your PostgreSQL server.

2.  Create a database:

```sql 
CREATE DATABASE deadline_manager_db;
```

3.  Create a user and give it access:

```sql
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE deadline_manager_db TO your_user;
```

### 3\. Update application.properties
```
# Application Name
spring.application.name=Deadline Manager API

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/deadline_manager_db
spring.datasource.username=your_db_username
spring.datasource.password=your_db_password

# JPA / Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Server Port
# server.port=8080
```

### 4\.Build and run the app
Use Maven to build and run the Spring Boot app:

```bash
./mvnw spring-boot:run
```
Once started, the API will be available at:

```
http://localhost:8080/api/v1/
```
## Example Queries
Create a Project
```
POST /api/v1/projects
Content-Type: application/json

{
  "title": "Final Essay",
  "description": "Write the final essay for History 101",
  "course": "History 101",
  "dueDate": "2025-07-20",
  "weight": 20,
  "difficulty": 5,
  "status": "IN_PROGRESS"
}
```

Create a Task in a Project

```
POST /api/v1/projects/1/tasks
Content-Type: application/json

{
  "title": "Research topic",
  "description": "Gather sources for essay",
  "dueDate": "2025-07-10",
  "estimatedHours": 5,
  "difficulty": 3,
  "status": "NOT_STARTED",
  "projectId": 1
}
```

Update Task Status
```
PATCH /api/v1/projects/1/tasks/3/status?newStatus=COMPLETED
```

## Future Improvements

-   **Frontend Interface**: Build a user-friendly React or vanilla HTML/CSS frontend to visualize and manage projects and tasks more intuitively.

-   **Authentication & Authorization**: Add user login support with role-based access to secure project/task data.

-   **Notification System**: Implement email or in-app reminders for upcoming deadlines.

-   **Advanced Priority Tuning**: Allow users to customize the weight of different priority factors (due date, difficulty, etc.).
