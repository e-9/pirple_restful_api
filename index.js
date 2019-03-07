/*
 * Primary file for API
 *
 */

// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const config = require("./config");
const router = require("./router");
const helpers = require("./lib/helpers");

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => unifiedServer(req, res));

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log(
    `The server is listening on port ${config.httpPort} in ${config.envName}`
  );
});

// Instantiate the HTTPS server
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(
    `The server is listening on port ${config.httpsPort} in ${config.envName}`
  );
});

// All the server logic for both http and https servers
const unifiedServer = (req, res) => {
  // Get URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get path
  const { pathname } = parsedUrl;
  const trimmedPathname = pathname.replace(/^\/+|\/+$/g, "");

  // Get the query string object
  const { query } = parsedUrl;

  // Get method
  const { method } = req;

  // Get headers
  const { headers } = req;

  // Get the payload, if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", data => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    // Choose the handler this request should go to or notFound
    const chosenHandler =
      typeof router[trimmedPathname] !== "undefined"
        ? router[trimmedPathname]
        : router.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath: trimmedPathname,
      queryStringObject: query,
      method: method.toLowerCase(),
      headers: headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    chosenHandler(data)
      .then(handlerResponse => {
        // Use status code from handler response or default it to 200
        const statusCode =
          typeof handlerResponse.statusCode === "number"
            ? handlerResponse.statusCode
            : 200;

        // Use the payload from the handler response or default to an empty obj
        const payload =
          typeof handlerResponse.payload === "object"
            ? handlerResponse.payload
            : {};

        // Convert the payload to a string
        const payloadString = JSON.stringify(payload);

        // Return the response
        res.setHeader("Content-Type", "application/json");
        res.writeHead(statusCode);
        res.end(payloadString);

        console.log("Returning this response:", statusCode, payloadString);
      })
      .catch(e => {
        console.error(e);
        res.writeHead(e.statusCode ? e.statusCode : 500, {
          "Content-Type": "application/json"
        });
        if (e.Error) {
          res.write(JSON.stringify({ Error: e.Error }));
        }
        res.end();
      });
  });
};
