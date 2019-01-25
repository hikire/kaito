const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const { watch } = fs;

async function readJson(fileName) {
  const content = await readFile(fileName, "utf-8");
  return JSON.parse(content);
}

module.exports = {
  readFile,
  writeFile,
  readJson,
  watch
};
