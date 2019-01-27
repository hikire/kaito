var process = { env: { NODE_ENV: "development" } };
var __kaito__exports = {};
var __kuaito__modules = {
  1: [
    function(require, module, exports) {
      "use strict";

      // import React from "react";
      // import ReactDOM from "react-dom";
      // const log = require("./logger.js").default;
      // require("./extra");
      // log();
      // const root = document.getElementById("app") || document.createElement("div");
      // root.id = "app";
      // document.body.appendChild(root);
      // ReactDOM.render(<h1>Yo!!!!</h1>, root);
      {
        console.log("not production");
      }
      console.log("everywhere");
    },
    {},
    __kaito__exports
  ]
};
var __kaito__require = function require(id) {
  var [fn, mapping, exports] = __kaito__modules[id];
  if (exports !== __kaito__exports) return exports;
  function localRequire(localFileName) {
    console.log(id, mapping[localFileName]);
    return require(mapping[localFileName]);
  }
  var module = { exports: {} };
  //__kaito__modules[id][2] = module.exports;
  fn(localRequire, module, module.exports);
  return (__kaito__modules[id][2] = module.exports);
};
__kaito__require(1);
