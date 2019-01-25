var process = { env: { NODE_ENV: "development" } };
var __kaito__exports = {};
var __kaito__modules = {
  1: [
    function(require, module, exports) {
      "use strict";

      // import React from "react";
      // import ReactDOM from "react-dom";
      const log = require("./logger.js").default;

      require("./extra");

      log(); // const root = document.getElementById("app") || document.createElement("div");
      // root.id = "app";
      // document.body.appendChild(root);
      // ReactDOM.render(<h1>Yo!!!!</h1>, root);
    },
    { "./logger.js": 2, "./extra": 3 },
    __kaito__exports
  ],
  2: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;

      var _message = require("./message.js");

      var _default = () => console.log(_message.message);

      exports.default = _default;
    },
    { "./message.js": 4 },
    __kaito__exports
  ],
  3: [
    function(require, module, exports) {
      "use strict";

      console.log("extra");
    },
    {},
    __kaito__exports
  ],
  4: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.message = void 0;
      const message = "Yo :\\";
      exports.message = message;

      require("./extra");
    },
    { "./extra": 3 },
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
