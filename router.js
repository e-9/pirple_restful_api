/*
 * Routes defined to handle the
 * users requests
 *
 */

// Dependencies
const handlers = require("./lib/handlers");

// Define a request router
const router = {
  ping: handlers.ping,
  notFound: handlers.notFound,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};

module.exports = router;
