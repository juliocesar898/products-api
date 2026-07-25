# 🛒 Products Search API (NestJS + Elasticsearch + Redis)

A high-performance, resilient, and scalable Search & Autocomplete Service built with **NestJS**, following **Hexagonal Architecture (Ports & Adapters)** principles.

This service integrates **Elasticsearch** as its core search engine (supporting fuzzy matching, field boosting, and faceted aggregations) and **Redis** for sub-millisecond caching (look-aside strategy for autocomplete).

---

## 📐 Architecture Overview: Hexagonal Architecture (Ports & Adapters)

The application strictly separates business logic from infrastructure, framework, and third-party dependencies.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                           │
│  ┌───────────────────────┐           ┌───────────────────────┐  │
│  │   HTTP Controllers    │           │ Elasticsearch Adapter │  │
│  │    (NestJS / REST)    │           │     Redis Adapter     │  │
│  └───────────┬───────────┘           └───────────▲───────────┘  │
└──────────────│───────────────────────────────────│──────────────┘
               │ (Primary)                         │ (Secondary)
               ▼                                   │
┌──────────────────────────────────────────────────┴──────────────┐
│                        APPLICATION                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Use Cases: SearchProductsUseCase, AutocompleteUseCase    │  │
│  └───────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────│───────────────────────────────┘  │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                           DOMAIN                                │
│  ┌────────────────────────┐         ┌────────────────────────┐  │
│  │ Domain Entities        │         │ Port Interfaces        │  │
│  │ (Product)              │         │ (ISearchRepository,    │  │
│  │                        │         │  ICacheRepository)     │  │
│  └────────────────────────┘         └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Layers

1. **Domain (`src/domain/`)**: Contains pure business entities, types, and Port contracts (`ISearchRepository`, `ICacheRepository`). It has zero dependencies on NestJS, Elasticsearch, or Redis.
2. **Application (`src/application/`)**: Implements orchestration logic via Use Cases (`SearchProductsUseCase`, `AutocompleteUseCase`) and Input DTOs with validation rules.
3. **Infrastructure (`src/infrastructure/`)**: Contains framework-dependent code, including HTTP Controllers, Elasticsearch Query DSL Adapters, Redis Cache Adapters, and the Database Seeding utility.

---

## ⚡ Core Features

- **Multi-field Search with Relevance Boosting**: Queries match across `name` (3x boost), `category` (2x boost), `subcategories`, and `description`.
- **Fuzzy Matching**: Tolerates typos and misspellings (e.g., searching `laptob` resolves to `laptop`).
- **Faceted Search (Aggregations)**: Generates dynamic aggregations for categories, subcategories, locations, and price statistics (`min`, `max`, `avg`).
- **Sub-millisecond Autocomplete Caching**: Utilizes a **Look-aside Cache** pattern via Redis with automatic TTL expiration (300s).
- **Fully Containerized**: Ready to run with a single command via Docker Compose.

---

## 🛠️ Tech Stack

- **Language/Framework**: TypeScript, NestJS (v11)
- **Search Engine**: Elasticsearch (v8.19)
- **In-Memory Store**: Redis (v7 Alpine)
- **Validation & Transformation**: `class-validator`, `class-transformer`
- **Containerization**: Docker, Docker Compose

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js](https://nodejs.org/) (v20+ recommended for local development).

---

### 1. Clone & Environment Configuration

```bash
git clone https://github.com/your-username/products-api.git
cd products-api
```

---

### 2. Run Application with Docker Compose

Start the API, Elasticsearch, and Redis services simultaneously:

```bash
docker compose up -d --build
```

Verify that all containers are healthy:

```bash
docker compose ps
```

The server will be available at: `http://localhost:3000/api/v1`

---

### 3. API Documentation (Swagger)

Once the application is running, you can access the interactive Swagger/OpenAPI documentation to explore, inspect, and test the endpoints directly from your browser:

- **URL:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

### 4. Seed Elasticsearch with Mock Data

Populate Elasticsearch with initial test products and completion mappings:

```bash
docker compose exec app npm run seed
```

_Output:_

```text
🌱 Starting Elasticsearch Seed script...
✅ Index 'products' created with custom mappings.
🚀 Seed executed successfully!
```

---

## 🧪 API Endpoints & Testing

### 1. Search Products (With Filters & Facets)

- **URL**: `GET /api/v1/search`
- **Query Parameters**:
  - `q` (optional): Free-text search term (supports fuzzy search).
  - `category` (optional): Filter by exact category key.
  - `subcategories` (optional): Filter by subcategory (can be passed multiple times).
  - `location` (optional): Filter by city/location.
  - `minPrice` / `maxPrice` (optional): Price range.
  - `page` (optional, default: `1`): Page number.
  - `limit` (optional, default: `10`): Items per page.
  - `sortBy` (optional): `relevance` | `popularity` | `created_at` | `price_asc` | `price_desc`.

#### Example Request:

```bash
curl "http://localhost:3000/api/v1/search?q=laptob&category=electronics&minPrice=500"
```

#### Sample Response:

```json
{
  "total": 2,
  "page": 1,
  "limit": 10,
  "results": [
    {
      "id": "jxdzlZ8BQJp9wgmsidLm",
      "name": "Laptop HP Pavilion 15",
      "description": "Ideal laptop for work and study with Ryzen 7",
      "category": "electronics",
      "subcategories": ["laptops", "office"],
      "location": "Valencia",
      "price": 650,
      "popularity": 80,
      "createdAt": "2026-07-24T18:46:44.963Z"
    }
  ],
  "facets": {
    "categories": { "electronics": 2 },
    "subcategories": { "laptops": 2, "office": 1, "gaming": 1 },
    "locations": { "Valencia": 1, "Caracas": 1 },
    "priceStats": { "min": 650, "max": 1800, "avg": 1225 }
  },
  "suggestions": []
}
```

---

### 2. Autocomplete Suggestions

- **URL**: `GET /api/v1/search/autocomplete`
- **Query Parameters**:
  - `q` (required): Prefix string (min length: 1).

#### Example Request:

```bash
curl "http://localhost:3000/api/v1/search/autocomplete?q=lap"
```

#### Sample Response:

```json
{
  "suggestions": ["ASUS ROG Strix Gaming Laptop", "HP Pavilion 15 Laptop"]
}
```

---

## 📦 Postman Collection

A pre-configured Postman collection is provided in the repository under:

```text
docs/postman/Products_API.postman_collection.json
```

### Import Instructions:

1. Open **Postman** and click **Import**.
2. Select `docs/postman/Products_API.postman_collection.json`.
3. Set the `baseUrl` collection variable to match your environment:
   - **Local Environment:** `http://localhost:3000/api/v1`
   - **Remote Environment:** `http://137.184.27.89:3000/api/v1`

---

## 📄 License

This project is licensed under the MIT License.
