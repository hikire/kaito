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
  const dir = path.dirname(fileName);
  const asset = await createAsset(fileName);
  const assets = [asset];

  for (const asset of assets) {
    asset.mapping = {};
    for (const dep of asset.dependencies) {
      const childAsset = await createAsset(path.join(dir, dep));
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
