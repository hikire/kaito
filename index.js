const fs = require("fs");
const { promisify, inspect: rawInspect } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAstAsync } = require("@babel/core");

function inspect(...vals) {
  console.log(
    ...vals.map(v =>
      rawInspect(v, { compact: false, depth: 5, breakLength: 80 })
    )
  );
}

async function readJson(fileName) {
  const content = await readFile(fileName, "utf-8");
  return JSON.parse(content);
}

function ensureExt(fileName) {
  if (!fileName.endsWith(".js")) return fileName + ".js";
  return fileName;
}

let id = 0;

async function createAsset(fileName) {
  const content = await readFile(fileName, "utf-8");
  const ast = parse(content, {
    sourceType: "module",
    plugins: ["jsx"]
  });

  const dependencies = [];

  traverse(ast, {
    ImportDeclaration({ node }) {
      dependencies.push(node.source.value);
    },
    CallExpression({ node }) {
      const { callee, arguments } = node;
      if (callee.name !== "require") return;
      const [fileArgument] = arguments;
      if (!fileArgument) throw new Error("No files were passed to require!");
      if (fileArgument.type !== "StringLiteral")
        throw new Error("Dynamic Require isn't currently supported");
      dependencies.push(fileArgument.value);
    }
  });

  const { code: transformed } = await transformFromAstAsync(ast, content, {
    presets: ["@babel/env"],
    plugins: ["@babel/plugin-transform-react-jsx"]
  });

  return {
    id: id++,
    fileName,
    content,
    dependencies,
    transformed
  };
}

async function createGraph(fileName) {
  const asset = await createAsset(fileName);
  const assets = [asset];

  for (const asset of assets) {
    const dir = path.dirname(asset.fileName);
    asset.mapping = {};
    for (const dep of asset.dependencies) {
      let depFile;
      if (dep.startsWith("./") || dep.startsWith("../"))
        depFile = path.join(dir, ensureExt(dep));
      else {
        const packageName = dep.split("/")[0];
        console.log(dep, packageName);
        const packagePath = `node_modules/${packageName}`;
        const package = await readJson(path.join(packagePath, "package.json"));
        const mainFile = package.main || "index.js";
        depFile = path.join(packagePath, mainFile);
      }
      const childAsset = await createAsset(depFile);
      asset.mapping[dep] = childAsset.id;
      assets.push(childAsset);
    }
  }

  inspect(assets);

  return assets;
}

async function bundle(entry) {
  id = 0;
  const graph = await createGraph(entry);
  const modules = graph
    .map(
      a => `
    ${a.id} : [function(require, module, exports){
      ${a.transformed}
    }, ${JSON.stringify(a.mapping)}]
  `
    )
    .join(",");
  const result = `
    var process = {env:{NODE_ENV : 'production'}};
    (function(modules){
      function require(id) {
        var [fn, mapping] = modules[id];
        function localRequire(localFileName) {
          return require(mapping[localFileName]);
        }
        var module = {exports:{}};
        fn(localRequire, module, module.exports);
        return module.exports;
      }

      require(0);
    })({${modules}})
  `;
  return result;
}

async function main() {
  const result = await bundle("./example/index.js");
  await writeFile("bundle.out.js", result);
  console.log("Done!");
}

main().catch(console.error);
