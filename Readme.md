# Real-Time Leaderboard Service

This project was developed as part of a backend engineering task for Ringr AI, focused on building a high-performance leaderboard system that can scale to millions of users per game and handle thousands of score updates and reads per second.

## High-Level Architecture

![image](https://github.com/user-attachments/assets/303411b2-f07c-42d2-ae63-6afd6d42395f)


### Trade-offs Made
1. **Eventual Consistency**: Faster writes with async cache invalidation
2. **Memory vs Accuracy**: Approximate rankings for windowed queries
3. **Durability**: WAL

## Key Components:

1. Score Ingestion Endpoint: Accepts incoming player scores.

2. Top-K Leaders Endpoint: Returns top K players in a game.

3. Rank/Percentile Endpoint: Provides a user’s current rank and percentile.

4. Sliding Window Support: Enables time-based (e.g., 24h) leaderboard queries.


## Local Setup
### Traditional Setup
```
git clone https://github.com/your-org/leaderboard-service.git
cd leaderboard-service
cp .env.example .env
npm install
npx prisma db push
npm run migrate
npm run generate
npm run dev
```

### Docker Setup
```
cp .env.example .env
docker-compose up -d
```

## Swagger UI:
#### Visit: http://localhost:8000/docs

## Testing Instructions

### Use Swagger to test APIs:

1. POST /api/v1/score → Add new scores

2. GET /games/{game_id}/leaders?limit=K → Fetch top-K leaders

3. GET /games/{game_id}/users/{user_id}/rank → Fetch rank & percentile

4. Use ?window=24 for sliding window support

## Design Summary

### Design Decisions:

1. Node.js + Express: Simplicity and speed.

2. PostgreSQL: Transactional support and strong consistency.

3. In-memory Caching: Used per game for recent scores to serve Top-K quickly.

4. Prisma ORM: For safe and fast DB interactions.

### Known Limitations:

1. In-memory cache is not persistent across restarts.

2. No real-time sync across nodes yet (no Redis or Kafka).

3. Sliding window queries not optimized (no pre-bucketing).

### Future Work:

1. Distributed sharding of leaderboard data.

2. Redis/ZooKeeper for cache consistency.

3. Real-time pub-sub with Kafka or NATS.

4. Sliding window pre-aggregations for high read volume.

## Big-O Analysis:
1. Ingest Score: O(log N) — inserting into a sorted array or heap.

2. Get Top-K: O(K) — extracting top K from heap or slicing a sorted structure.

3. Get Rank: O(log N) — binary search on a sorted array.

4. Sliding Window Filter: O(N) — naive linear scan by timestamp.
