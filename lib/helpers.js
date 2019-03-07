/*
 * Helpers functions
 *
 */

// Dependencies
const crypto = require("crypto");
const config = require("../config");

// Helpers constructor
const helpers = {};

// Hash string
helpers.hash = str => {
  if (typeof str === "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else return false;
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
};

// Export module
module.exports = helpers;
