const { readFile } = require("./fs");
const { inspect } = require("./utils");
const dotenv = require("dotenv");
const { promisify } = require("util");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const { transformFromAstAsync } = require("@babel/core");
const resolve = promisify(require("resolve"));

const BUNDLE_ENV = "development";

// starts from 1 for easier conditions
let id = 1;

const files = new Map(); // path -> id

async function createAsset(rawFileName, forceCreate = false, env) {
  const fileName = path.normalize(rawFileName);
  if (!forceCreate && files.has(fileName)) return { id: files.get(fileName) };
  const content = await readFile(fileName, "utf-8");
  const ast = parse(content, {
    sourceType: "module",
    plugins: ["jsx"]
  });

  const dependencies = [];
  const t = types;
  traverse(ast, {
    MemberExpression(path) {
      if (
        t.isMemberExpression(path.node.object) &&
        path.node.object.property.name === "env"
      ) {
        if (
          t.isIdentifier(path.node.object.object) &&
          path.node.object.object.name === "process"
        )
          path.replaceWith(
            typeof env[path.node.property.name] === "string"
              ? t.stringLiteral(env[path.node.property.name])
              : t.identifier("undefined")
          );
      }
    }
  });

  traverse(ast, {
    Conditional(path) {
      const test = path.get("test");
      const evaluate = test.evaluate();
      if (!evaluate.confident) return;
      const next = evaluate.value ? "consequent" : "alternate";
      if (!path.node[next]) return path.remove();
      path.replaceWith(path.node[next]);
    }
  });

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

async function createGraph(fileName, env) {
  //console.log(fileName, path.normalize(fileName));
  const asset = await createAsset(
    await resolve(fileName, { basedir: "./" }),
    true,
    env
  );
  //console.log(asset);
  const assets = [asset];

  for (const asset of assets) {
    const dir = path.dirname(asset.fileName);
    asset.mapping = {};
    for (const dep of asset.dependencies) {
      const depFile = await resolve(dep, { basedir: dir });
      const childAsset = await createAsset(depFile, false, env);
      asset.mapping[dep] = childAsset.id;
      // only newly createdAssets get sent to HMR
      if (childAsset.transformed) assets.push(childAsset);
    }
  }

  return assets;
}

let env = {};

async function bundle(entry) {
  files.clear();
  id = 1;
  env = { NODE_ENV: BUNDLE_ENV };
  try {
    Object.assign(env, dotenv.parse(await readFile("./.env", "utf-8")));
  } catch {}
  try {
    Object.assign(
      env,
      dotenv.parse(await readFile("./.env.development", "utf-8"))
    );
  } catch {}
  const graph = await createGraph(entry, env);
  const modules = graph
    .map(
      a => `
    ${a.id} : [function(require, module, exports){
      ${a.transformed}
    }, 
    ${JSON.stringify(a.mapping)}, 
    __kaito__exports
  ]
  `
    )
    .join(",");
  const result = `
    var process = {env:${JSON.stringify(env)}};
    var __kaito__exports = {};
    var __kaito__modules = {${modules}};
    var __kaito__require = function require(id) {
        var [fn, mapping, exports] = __kaito__modules[id];
        if(exports !== __kaito__exports) return exports;
        function localRequire(localFileName) {
          console.log(id, mapping[localFileName]);
          return require(mapping[localFileName]);
        }
        var module = {exports:{}};
        //__kaito__modules[id][2] = module.exports;
        fn(localRequire, module, module.exports);
        return __kaito__modules[id][2]= module.exports;
      }
      __kaito__require(1);
  `;
  return result;
}

async function bundleAsset(fileName) {
  const assets = await createGraph(fileName, env);
  return `
    ${assets
      .map(
        a => `
    __kaito__modules[${a.id}] = [
      function(require, module, exports){
        ${a.transformed}
      }, 
      ${JSON.stringify(a.mapping)}, 
      __kaito__exports
    ];
    `
      )
      .join("")}
      function __kaito__moduleInvalidate(id, leaf) {
        console.log("invalidate",id, leaf);
        if(id === leaf) return true;
        var current = __kaito__modules[id];
        var isLeafParent = false;
        Object.values(current[1]).forEach(function(child) {
          isLeafParent = isLeafParent || __kaito__moduleInvalidate(child, leaf);
        });
        if(isLeafParent) current[2] = __kaito__exports;
        return isLeafParent;
      }
      __kaito__moduleInvalidate(1, ${assets[0].id});
      console.log("HMR!");
      __kaito__require(1);
  `;
}

module.exports = {
  bundle,
  bundleAsset
};
