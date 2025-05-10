import { limiter } from "../config/rateLimiter";
import express from "express";
import {
  create,
  getTopKLeaders,
  getUserRank,
} from "../controllers/score.controller";

const router = express.Router();

/**
 * @swagger
 * /api/v1/score:
 *   post:
 *     summary: Submit score(s) - single or batch
 *     description: |
 *       Accepts individual scores or batches up to 1000 entries.
 *       Processed asynchronously for high throughput.
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Score'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Score'
 *                 maxItems: 1000
 *             examples:
 *               single:
 *                 value:
 *                   user_id: "user123"
 *                   game_id: "game456"
 *                   score: 1500
 *                   timeStamp: "2024-02-20T12:34:56.789Z"
 *               batch:
 *                 value: [
 *                   { user_id: "user123", game_id: "game456", score: 1500, timeStamp: "2024-02-20T12:34:56.789Z" },
 *                   { user_id: "user789", game_id: "game456", score: 2000, timeStamp: "2024-02-20T12:34:56.789Z" }
 *                 ]
 *     responses:
 *       202:
 *         description: Score(s) accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Score(s) queued for processing"
 *                 queuedCount:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid input format
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *
 * components:
 *   schemas:
 *     Score:
 *       type: object
 *       required:
 *         - user_id
 *         - game_id
 *         - score
 *         - timeStamp
 *       properties:
 *         user_id:
 *           type: string
 *           pattern: "^[a-zA-Z0-9-_]{5,50}$"
 *         game_id:
 *           type: string
 *           pattern: "^[a-zA-Z0-9-]{5,20}$"
 *         score:
 *           type: integer
 *           format: int64
 *           minimum: 0
 *           maximum: 9223372036854775807
 *         timeStamp:
 *           type: string
 *           format: date-time
 */
router.post("/score", limiter, create);
/**
 * @swagger
 * /api/v1/games/{game_id}/leaders:
 *   get:
 *     summary: Get top K leaders for a game
 *     tags: [Scores]
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the game
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top players to retrieve
 *     responses:
 *       200:
 *         description: A list of top K players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       score:
 *                         type: number
 *                         format: float
 *                       timeStamp:
 *                         type: string
 *                         format: date-time
 */
router.get("/games/:game_id/leaders", limiter, getTopKLeaders);
/**
 * @swagger
 * /api/v1/games/{game_id}/users/{user_id}/rank:
 *   get:
 *     summary: Get current rank and percentile of a specific user
 *     tags: [Scores]
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the game
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: window
 *         required: false
 *         schema:
 *           type: string
 *         description: Get ranks within windowed time frames (e.g., 'pass 24 for 1 day', 'pass 48 for 2 day')
 *     responses:
 *       200:
 *         description: User rank and percentile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rank:
 *                   type: number
 *                   example: 5
 *                 percentile:
 *                   type: string
 *                   format: float
 *                   example: "92.75"
 *                 total_players:
 *                   type: number
 *                   example: 120
 *       404:
 *         description: User or game not found
 */

router.get("/games/:game_id/users/:user_id/rank", limiter, getUserRank);

export default router;
