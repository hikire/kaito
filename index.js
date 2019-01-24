const { readFile } = require("./fs");
const { inspect } = require("./utils");
const dotenv = require("dotenv");
const { promisify } = require("util");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAstAsync } = require("@babel/core");
const resolve = promisify(require("resolve"));

const BUNDLE_ENV = "development";

// starts from 1 for easier conditions
let id = 1;

const files = new Map(); // path -> id

async function createAsset(fileName, forceCreate = false) {
  if (!forceCreate && files.has(fileName)) return { id: files.get(fileName) };
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
    presets: [
      [
        "@babel/env",
        {
          targets: {
            chrome: "70"
          }
        }
      ]
    ],
    plugins: ["@babel/plugin-transform-react-jsx"]
  });

  const asset = {
    id: files.get(fileName) || id++,
    fileName,
    content,
    dependencies,
    transformed
  };

  files.set(fileName, asset.id);
  return asset;
}

async function createGraph(fileName) {
  const asset = await createAsset(fileName, true);
  const assets = [asset];

  for (const asset of assets) {
    const dir = path.dirname(asset.fileName);
    asset.mapping = {};
    for (const dep of asset.dependencies) {
      const depFile = await resolve(dep, { basedir: dir });
      const childAsset = await createAsset(depFile);
      asset.mapping[dep] = childAsset.id;
      // only newly createdAssets get sent to HMR
      if (childAsset.transformed) assets.push(childAsset);
    }
  }

  return assets;
}

async function bundle(entry) {
  files.clear();
  id = 1;
  const env = { NODE_ENV: BUNDLE_ENV };
  try {
    Object.assign(env, dotenv.parse(await readFile("./.env", "utf-8")));
  } catch {}
  try {
    Object.assign(
      env,
      dotenv.parse(await readFile("./.env.development", "utf-8"))
    );
  } catch {}
  const graph = await createGraph(entry);
  const modules = graph
    .map(
      a => `
    ${a.id} : [function(require, module, exports){
      ${a.transformed}
    }, ${JSON.stringify(a.mapping)}, __kaito__exports]
  `
    )
    .join(",");
  const result = `
    var process = {env:${JSON.stringify(env)}};
    var __kaito__exports = {};
    (function(modules){
      function require(id) {
        var [fn, mapping, exports] = modules[id];
        if(exports !== __kaito__exports) return exports;
        function localRequire(localFileName) {
          return require(mapping[localFileName]);
        }
        var module = {exports:{}};
        fn(localRequire, module, module.exports);
        return modules[id][2] = module.exports;
      }

      require(1);
    })({${modules}})
  `;
  return result;
}

module.exports = {
  bundle
};
