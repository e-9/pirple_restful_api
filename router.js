/*
 * Routes defined to handle the
 * users requests
 *
 */

// Ping handler
const ping = () => new Promise(resolve => resolve({ statusCode: 200 }));

// Not Found handler
const notFound = () => new Promise(resolve => resolve({ statusCode: 404 }));

// Define a request router
const router = {
  ping,
  notFound
};

module.exports = router;
