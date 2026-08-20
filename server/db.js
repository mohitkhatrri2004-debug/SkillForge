/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — MONGODB CONNECTION

   Connects to MongoDB using the MONGODB_URI environment variable.
   Called once at server startup — not on every request.

   WHY A SEPARATE FILE:
   Keeping the connection logic out of server.js means:
   - server.js stays focused on routes
   - db.js can be imported by test files independently
   - The connection string never leaks into route code

   RECONNECTION:
   Mongoose handles reconnection automatically. If Atlas is
   temporarily unreachable, Mongoose queues operations and
   retries — no manual reconnect logic needed.

   LAST UPDATED: Week 7, Day 1
═══════════════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

/**
 * connectDB
 *
 * Reads MONGODB_URI from process.env (loaded by dotenv in server.js),
 * opens a Mongoose connection, and resolves when ready.
 *
 * Throws on connection failure so the server does not silently
 * start in a broken state — it is better to crash fast and let
 * the developer (or process manager) know there is a problem.
 *
 * @returns {Promise<void>}
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set.\n' +
      'Add it to server/.env — see server/.env.example for the format.'
    );
  }

  // Mongoose connection options
  // useNewUrlParser and useUnifiedTopology are defaults in Mongoose 8+
  // but listed here for clarity
  await mongoose.connect(uri);

  console.log(`[db] Connected to MongoDB: ${mongoose.connection.host}`);
}

module.exports = connectDB;
