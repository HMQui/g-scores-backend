# G-Scores Backend

A NestJS backend for importing and analyzing large student score datasets with PostgreSQL, TypeORM, and Docker.

## Key Features

- Stream-based CSV import for large files (1M+ rows) to prevent RAM overflow.
- Batch insert strategy for efficient database writes.
- Search student scores by registration number.
- Statistics grouped into four score levels for charting: `>=8`, `6 - <8`, `4 - <6`, `<4`.
- Top 10 Group A ranking computed via a PostgreSQL materialized view for high-performance queries.
- Swagger UI documentation available.

## Prerequisites

- Node.js (recommended 18+)
- Docker
- Docker Compose

## Environment Setup

1. Create a `.env` file in the project root.
2. Add the database connection variables, for example:

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=g_scores
```

3. Adjust values as needed to match your local environment.

## Start the Database

Run Docker Compose from the project root:

```bash
docker compose up -d
```

This starts PostgreSQL and pgAdmin4 based on `docker-compose.yml`.

## Run the Server Locally

Install dependencies once:

```bash
npm install
```

Start the NestJS server:

```bash
npm run start:dev
```

## Swagger UI

Once the server is running, open:

```text
http://localhost:3000/api
```

## Notes

- The CSV import flow uses streams and batch insertion to handle large datasets safely.
- The Group A endpoint relies on a materialized view for fast aggregation over math, physics, and chemistry scores.
- Validation and clear service separation are maintained using NestJS best practices.
