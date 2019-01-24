var process = { env: { NODE_ENV: "development" } };
var __kaito__exports = {};
(function(modules) {
  function require(id) {
    var [fn, mapping, exports] = modules[id];
    if (exports !== __kaito__exports) return exports;
    function localRequire(localFileName) {
      return require(mapping[localFileName]);
    }
    var module = { exports: {} };
    fn(localRequire, module, module.exports);
    return (modules[id][2] = module.exports);
  }

  require(0);
})({
  0: [
    function(require, module, exports) {
      "use strict";

      const log = require("./logger.js").default;

      log();
    },
    { "./logger.js": 1 },
    __kaito__exports
  ],
  1: [
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
    { "./message.js": 2 },
    __kaito__exports
  ],
  2: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.message = void 0;
      const message = "Yo :\\";
      exports.message = message;
    },
    {},
    __kaito__exports
  ]
});
