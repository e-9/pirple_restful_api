/*
 * Helpers functions
 *
 */

// Dependencies
const crypto = require("crypto");
const config = require("../config");
const https = require("https");
const querystring = require("querystring");

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

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
  strLength =
    typeof strLength === "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible chars that could go into a string
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";

    // Start the final string
    let str = "";

    for (let i = 1; i <= strLength; i++) {
      // Get a random character from the possibleCharacters string
      const randomChar = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );

      // Append this character to the final string
      str += randomChar;
    }

    // Return the final string
    return str;
  } else return false;
};

// Send an SMS message via Twilio
helpers.sendTwilioSms = (phone, msg) =>
  new Promise((resolve, reject) => {
    // Validate parameters
    phone =
      typeof phone === "string" && phone.trim().length === 10
        ? phone.trim()
        : false;
    msg =
      typeof msg === "string" &&
      msg.trim().length > 0 &&
      msg.trim().length <= 1600
        ? msg.trim()
        : false;

    if (phone && msg) {
      // Configure the request payload
      const payload = {
        From: config.twilio.fromPhone,
        To: "+1" + phone,
        Body: msg
      };

      // Stringify the payload
      const stringPayload = querystring.stringify(payload);

      // Configure the request payload
      const requestDetails = {
        protocol: "https:",
        hostname: "api.twilio.com",
        method: "POST",
        path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
        auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(stringPayload)
        }
      };

      // Instantiate the request object
      const req = https.request(requestDetails, res => {
        // Grab the status of the sent request
        const status = res.statusCode;
        // Resolve succesfully if the request went through
        if (status === 200 || status === 201) {
          resolve({ statusCode: status });
        } else reject({ statusCode: status });
      });

      // Bind to the error event so it doesn't get thrown
      req.on("error", e => reject({ statusCode: 500, Error: e }));

      // Add the payload
      req.write(stringPayload);

      // End the request
      req.end();
    } else reject({ statusCode: 400, Error: "Parameters missing or invalid" });
  });

// Export module
module.exports = helpers;
