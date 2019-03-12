/*
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to a file
lib.create = (dir, file, data) => {
  return new Promise((resolve, reject) => {
    // Open the file for writing
    fs.open(
      `${lib.baseDir}${dir}/${file}.json`,
      "wx",
      (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
          // Convert data to string
          const stringData = JSON.stringify(data);

          // Write to file and close it
          fs.writeFile(fileDescriptor, stringData, err => {
            if (!err) {
              fs.close(fileDescriptor, err => {
                if (!err) {
                  resolve();
                } else reject("Error closing new file");
              });
            } else reject("Error writing to new file");
          });
        } else reject("Could not create new file, it may already exist");
      }
    );
  });
};

// Read data from a file
lib.read = (dir, file) => {
  return new Promise((resolve, reject) => {
    const filePath = `${lib.baseDir}${dir}/${file}.json`;
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) reject(err);
      else if (data) {
        resolve(helpers.parseJsonToObject(data));
      } else {
        resolve(data);
      }
    });
  });
};

// Update data inside a file
lib.update = (dir, file, data) => {
  return new Promise((resolve, reject) => {
    const filePath = `${lib.baseDir}${dir}/${file}.json`;
    fs.open(filePath, "r+", (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        // Truncate the file
        fs.ftruncate(fileDescriptor, err => {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, err => {
              if (!err) {
                fs.close(fileDescriptor, err => {
                  if (!err) resolve();
                  else reject("Error closing file");
                });
              } else reject("Error writing to existing file");
            });
          } else reject("Error truncating the file");
        });
      } else reject("Could not open the file for updating");
    });
  });
};

lib.delete = (dir, file) => {
  return new Promise((resolve, reject) => {
    const filePath = `${lib.baseDir}${dir}/${file}.json`;

    // Unlink the file
    fs.unlink(filePath, err => {
      if (!err) resolve();
      else reject(err);
    });
  });
};

// Export the module
module.exports = lib;
