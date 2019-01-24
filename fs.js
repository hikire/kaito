const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

async function readJson(fileName) {
  const content = await readFile(fileName, "utf-8");
  return JSON.parse(content);
}

module.exports = {
  readFile,
  readJson
};
