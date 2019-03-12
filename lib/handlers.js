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
};

// Users - get
// Required data - phone
// Optional data: none
// @TODO only let an authenticated user access their object.
handlers._users.get = data => {
  return new Promise((resolve, reject) => {
    // CHeck that the phone number is valid
    const phone =
      typeof data.queryStringObject.phone === "string" &&
      data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;

    if (phone) {
      // Lookup the user
      _data
        .read("users", phone)
        .then(userObj => {
          // Remove the hashed password from the user object
          delete userObj.hashedPassword;
          resolve({ statusCode: 200, payload: userObj });
        })
        .catch(() => reject({ statusCode: 404, Error: "User not found" }));
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });
};

// Users - put
// Required data - phone
// Optional data - firsName, lastName, password (at least one must be specified)
// @TODO only let an auth user update their own object
handlers._users.put = data => {
  return new Promise((resolve, reject) => {
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
                reject({ statusCode: 500, Error: "Could not update the user" });
              });
          })
          .catch(() => reject({ statusCode: 400, Error: "User not found" }));
      } else reject({ statusCode: 400, Error: "Missing fields to update" });
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });
};

// Users - delete
// Required data: phone
// @TODO only let auth user delete their object
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = data => {
  return new Promise((resolve, reject) => {
    // CHeck that the phone number is valid
    const phone =
      typeof data.queryStringObject.phone === "string" &&
      data.queryStringObject.phone.trim().length === 10
        ? data.queryStringObject.phone.trim()
        : false;

    if (phone) {
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
    } else reject({ statusCode: 400, Error: "Missing required fields" });
  });
};

// Ping handler
handlers.ping = () => new Promise(resolve => resolve({ statusCode: 200 }));

// Not Found handler
handlers.notFound = () => new Promise(resolve => resolve({ statusCode: 404 }));

// Export the module
module.exports = handlers;