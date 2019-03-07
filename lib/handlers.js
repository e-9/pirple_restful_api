/*
 * Request handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Define the handlers
const handlers = {};

// Users
// TODO: Change this to async await
handlers.users = data => {
  return new Promise((resolve, reject) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.includes(data.method)) {
      handlers._users[data.method](data)
        .then(data => resolve(data))
        .catch(err => reject(err));
    } else reject(405);
  });
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = data => {
  return new Promise((resolve, reject) => {
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
      console.log(firstName, lastName, phone, password, tosAgreement);
      // Make sure that the user doesnt already exists
      _data
        .read("users", phone)
        .then(() => reject({ statusCode: 400, Error: "User already exists" }))
        .catch(err => {
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
};

// Users - get
handlers._users.get = data => {
  return new Promise((resolve, reject) => {});
};

// Users - put
handlers._users.put = data => {
  return new Promise((resolve, reject) => {});
};

// Users - delete
handlers._users.delete = data => {
  return new Promise((resolve, reject) => {});
};

// Ping handler
handlers.ping = () => new Promise(resolve => resolve({ statusCode: 200 }));

// Not Found handler
handlers.notFound = () => new Promise(resolve => resolve({ statusCode: 404 }));

// Export the module
module.exports = handlers;
