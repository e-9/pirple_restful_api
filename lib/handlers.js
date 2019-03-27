/*
 * Request handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("../config");

// Define the handlers
const handlers = {};

// Users
handlers.users = data =>
  new Promise((resolve, reject) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.includes(data.method)) {
      handlers._users[data.method](data)
        .then(data => resolve(data))
        .catch(err => reject(err));
    } else reject(405);
  });

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = data =>
  new Promise((resolve, reject) => {
    // Check required fields
    const firstName =
      typeof data.payload.firstName === "string" &&
      data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim()
        : false;
    const lastName =
      typeof data.payload.lastName === "string" &&
      data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim()
        : false;
    const phone =
      typeof data.payload.phone === "string" &&
      data.payload.phone.trim().length >= 10
        ? data.payload.phone.trim()
        : false;
    const password =
      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    const tosAgreement =
      typeof data.payload.tosAgreement === "boolean" &&
      data.payload.tosAgreement
        ? true
        : false;

    if (firstName && lastName && phone && password) {
      // Make sure that the user doesnt already exists
      _data
        .read("users", phone)
        .then(() => reject({ statusCode: 400, Error: "User already exists" }))
        .catch(() => {
          // Hash the password
          const hashedPassword = helpers.hash(password);

          if (hashedPassword) {
            // Create user object
            const userObj = {
              firstName,
              lastName,
              phone,
              hashedPassword,
              tosAgreement
            };

            // Store new user
            _data
              .create("users", phone, userObj)
              .then(() => resolve({ statusCode: 200 }))
              .catch(err =>
                reject({
                  statusCode: 500,
                  Error: "Could not create the new user: " + err
                })
              );
          } else
            reject({
              statusCode: 500,
              Error: `Could not hash the user's password`
            });
        });
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });

// Users - get
// Required data - phone
// Optional data: none
handlers._users.get = data =>
  new Promise((resolve, reject) => {
    // CHeck that the phone number is valid
    const phone =
      typeof data.queryStringObject.phone === "string" &&
      data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;

    if (phone) {
      // Get the token from the headers
      const token =
        typeof data.headers.token === "string" ? data.headers.token : false;

      // Verify that the given token is valid for the phone number
      handlers._tokens
        .verifyToken(token, phone)
        .then(() => {
          // Lookup the user
          _data
            .read("users", phone)
            .then(userObj => {
              // Remove the hashed password from the user object
              delete userObj.hashedPassword;
              resolve({ statusCode: 200, payload: userObj });
            })
            .catch(() => reject({ statusCode: 404, Error: "User not found" }));
        })
        .catch(() =>
          reject({
            statusCode: 403,
            Error: "Missing required token in header, or token is invalid."
          })
        );
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });

// Users - put
// Required data - phone
// Optional data - firsName, lastName, password (at least one must be specified)
handlers._users.put = data =>
  new Promise((resolve, reject) => {
    // Check for the required field
    const phone =
      typeof data.payload.phone === "string" &&
      data.payload.phone.trim().length === 10
        ? data.payload.phone.trim()
        : false;

    // Check for the optional fields
    const firstName =
      typeof data.payload.firstName === "string" &&
      data.payload.firstName.trim().length > 0
        ? data.payload.firstName.trim()
        : false;
    const lastName =
      typeof data.payload.lastName === "string" &&
      data.payload.lastName.trim().length > 0
        ? data.payload.lastName.trim()
        : false;
    const password =
      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;

    // Error if the phone is invalid
    if (phone) {
      // Error if nothing is sent to update
      if (firstName || lastName || password) {
        // Get the token from the headers
        const token =
          typeof data.headers.token === "string" ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens
          .verifyToken(token, phone)
          .then(() => {
            // Lookup the user
            _data
              .read("users", phone)
              .then(userObj => {
                // Update the fields necessary
                if (firstName) userObj.firstName = firstName;
                if (lastName) userObj.lastName = lastName;
                if (password) userObj.hashedPassword = helpers.hash(password);

                // Store the new updates
                _data
                  .update("users", phone, userObj)
                  .then(() => resolve({ statusCode: 200 }))
                  .catch(err => {
                    console.log(err);
                    reject({
                      statusCode: 500,
                      Error: "Could not update the user"
                    });
                  });
              })
              .catch(() =>
                reject({ statusCode: 400, Error: "User not found" })
              );
          })
          .catch(() =>
            reject({
              statusCode: 403,
              Error: "Missing required token in header, or token is invalid."
            })
          );
      } else reject({ statusCode: 400, Error: "Missing fields to update" });
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });

// Users - delete
// Required data: phone
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = data =>
  new Promise((resolve, reject) => {
    // CHeck that the phone number is valid
    const phone =
      typeof data.queryStringObject.phone === "string" &&
      data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;

    if (phone) {
      // Get the token from the headers
      const token =
        typeof data.headers.token === "string" ? data.headers.token : false;

      // Verify that the given token is valid for the phone number
      handlers._tokens
        .verifyToken(token, phone)
        .then(() => {
          // Lookup the user
          _data
            .read("users", phone)
            .then(() => {
              _data
                .delete("users", phone)
                .then(() => resolve({ statusCode: 200 }))
                .catch(err => {
                  console.log(err);
                  reject({
                    statusCode: 500,
                    Error: "Could not delete the specified user"
                  });
                });
            })
            .catch(() =>
              reject({
                statusCode: 400,
                Error: "Could not find the specified user"
              })
            );
        })
        .catch(() =>
          reject({
            statusCode: 403,
            Error: "Missing required token in header, or token is invalid."
          })
        );
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });

// Tokens
handlers.tokens = data =>
  new Promise((resolve, reject) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.includes(data.method)) {
      handlers._tokens[data.method](data)
        .then(data => resolve(data))
        .catch(err => reject(err));
    } else reject(405);
  });

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = data =>
  new Promise((resolve, reject) => {
    const phone =
      typeof data.payload.phone === "string" &&
      data.payload.phone.trim().length >= 10
        ? data.payload.phone.trim()
        : false;
    const password =
      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;

    if (phone && password) {
      // Lookup the user who matches the phone number
      _data
        .read("users", phone)
        .then(userData => {
          // Hash the sent password, and compare it to the password stored in the user object
          const hashedPassword = helpers.hash(password);

          if (hashedPassword === userData.hashedPassword) {
            // Create a new token with a randome name. Set expiration date 1 hour in the future
            const tokenId = helpers.createRandomString(20);
            const expires = Date.now() + 1000 * 60 * 60;
            const tokenObj = {
              phone: phone,
              id: tokenId,
              expires: expires
            };

            // Store the token
            _data
              .create("tokens", tokenId, tokenObj)
              .then(() => resolve({ statusCode: 200, payload: tokenObj }))
              .catch(err =>
                reject({
                  statusCode: 500,
                  Error: "Could not create the new token"
                })
              );
          } else
            reject({
              statusCode: 400,
              Error: "Password did not match the specified user stored password"
            });
        })
        .catch(() =>
          reject({
            statusCode: 400,
            Error: "COuld not find the specified user"
          })
        );
      //
    } else
      reject({
        statusCode: 400,
        Error: "Missing required fields"
      });
  });

// Tokens - get
// Required data: id
handlers._tokens.get = data =>
  new Promise((resolve, reject) => {
    // CHeck that the id is valid
    const id =
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.id.trim().length === 20
        ? data.queryStringObject.id.trim()
        : false;

    if (id) {
      // Lookup the user
      _data
        .read("tokens", id)
        .then(tokenData => {
          resolve({ statusCode: 200, payload: tokenData });
        })
        .catch(() => reject({ statusCode: 404, Error: "Token not found" }));
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });

// Tokens - put
// Required data: id, extend
handlers._tokens.put = data =>
  new Promise((resolve, reject) => {
    const id =
      typeof data.payload.id === "string" &&
      data.payload.id.trim().length === 20
        ? data.payload.id.trim()
        : false;
    const extend =
      typeof data.payload.extend === "boolean" && data.payload.extend
        ? true
        : false;

    if (id && extend) {
      // Lookup the token
      _data
        .read("tokens", id)
        .then(tokenData => {
          // Check to make sure the token isn't already expired
          if (tokenData.expires > Date.now()) {
            // Set the expiration an hour from now
            tokenData.expires = Date.now() + 1000 * 60 * 60;

            // Store the new updates
            _data
              .update("tokens", id, tokenData)
              .then(() => resolve({ statusCode: 200 }))
              .catch(() =>
                reject({
                  statusCode: 500,
                  Error: "Could not update the token's expiration "
                })
              );
          } else
            reject({
              statusCode: 400,
              Error: "The token has already expired, and cannot be extended"
            });
        })
        .catch(() => reject({ statusCode: 404, Error: "Token not found" }));
    } else
      reject({
        statusCode: 400,
        Error: "Missing required fields or invalid fields"
      });
  });

// Tokens - delete
// Required data: id
handlers._tokens.delete = data =>
  new Promise((resolve, reject) => {
    // CHeck that the id is valid
    const id =
      typeof data.queryStringObject.id === "string" &&
      data.queryStringObject.id.trim().length === 20
        ? data.queryStringObject.id.trim()
        : false;

    if (id) {
      // Lookup the user
      _data
        .read("tokens", id)
        .then(() => {
          _data
            .delete("tokens", id)
            .then(() => resolve({ statusCode: 200 }))
            .catch(err => {
              console.log(err);
              reject({
                statusCode: 500,
                Error: "Could not delete the specified tokenm"
              });
            });
        })
        .catch(() =>
          reject({
            statusCode: 400,
            Error: "Could not find the specified token"
          })
        );
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone) =>
  new Promise((resolve, reject) => {
    // Lookup the token
    _data
      .read("tokens", id)
      .then(tokenData => {
        if (tokenData.phone === phone && tokenData.expires > Date.now()) {
          resolve(true);
        } else reject(false);
      })
      .catch(() => reject(false));
  });

// Checks
handlers.checks = data =>
  new Promise((resolve, reject) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.includes(data.method)) {
      handlers._checks[data.method](data)
        .then(data => resolve(data))
        .catch(err => reject(err));
    } else reject(405);
  });

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Require data: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.post = data =>
  new Promise((resolve, reject) => {
    // Validate inputs
    const protocol =
      typeof data.payload.protocol === "string" &&
      ["http", "https"].indexOf(data.payload.protocol) > -1
        ? data.payload.protocol
        : false;
    const url =
      typeof data.payload.url === "string" && data.payload.url.trim().length > 0
        ? data.payload.url.trim()
        : false;
    const method =
      typeof data.payload.method === "string" &&
      ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
        ? data.payload.method
        : false;
    const successCodes =
      typeof data.payload.successCodes === "object" &&
      data.payload.successCodes instanceof Array &&
      data.payload.url.trim().length > 0
        ? data.payload.successCodes
        : false;
    const timeoutSeconds =
      typeof data.payload.timeoutSeconds === "number" &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds >= 1 &&
      data.payload.timeoutSeconds <= 5
        ? data.payload.timeoutSeconds
        : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
      // Get the token from the headers
      const token =
        typeof data.headers.token === "string" ? data.headers.token : false;

      // Lookup the user by reading the token
      _data
        .read("tokens", token)
        .then(tokenData => {
          const userPhone = tokenData.phone;

          // Lookup the user data
          _data
            .read("users", userPhone)
            .then(userData => {
              const userChecks =
                typeof userData.checks === "object" &&
                userData.checks instanceof Array
                  ? userData.checks
                  : [];
              // Verify that the user has less than the number of max-checks-per-user
              if (userChecks.length < config.maxChecks) {
                // Create a random id for the check
                const checkId = helpers.createRandomString(20);

                // Create the check object, and include the user's phone
                const checkObject = {
                  id: checkId,
                  userPhone: userPhone,
                  protocol: protocol,
                  url: url,
                  method: method,
                  successCodes: successCodes,
                  timeoutSeconds: timeoutSeconds
                };

                _data
                  .create("checks", checkId, checkObject)
                  .then(() => {
                    // Add the check id to the user's object
                    userData.checks = userChecks;
                    userData.checks.push(checkId);

                    // Save the new user data
                    _data
                      .update("users", userPhone, userData)
                      .then(() =>
                        resolve({ statusCode: 200, payload: checkObject })
                      )
                      .catch(() =>
                        reject({
                          statusCode: 500,
                          Error: "Could not update the user with the new check"
                        })
                      );
                  })
                  .catch(err =>
                    reject({
                      statusCode: 500,
                      Error: "Could not create the new check"
                    })
                  );
              } else
                reject({
                  statusCode: 400,
                  Error: `The user already has the maximum number of checks (${
                    config.maxChecks
                  })`
                });
            })
            .catch(() => reject({ statusCode: 403, Error: "Invalid token" }));
        })
        .catch(() => reject({ statusCode: 403, Error: "Invalid token" }));
    } else
      reject({
        statusCode: 400,
        Error: "Missing required inputs, or inputs are invalid"
      });
  });

// Ping handler
handlers.ping = () => new Promise(resolve => resolve({ statusCode: 200 }));

// Not Found handler
handlers.notFound = () => new Promise(resolve => resolve({ statusCode: 404 }));

// Export the module
module.exports = handlers;
