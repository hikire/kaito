var process = { env: { NODE_ENV: "production" } };
(function(modules) {
  function require(id) {
    var [fn, mapping] = modules[id];
    function localRequire(localFileName) {
      return require(mapping[localFileName]);
    }
    var module = { exports: {} };
    fn(localRequire, module, module.exports);
    return module.exports;
  }

  require(0);
})({
  0: [
    function(require, module, exports) {
      "use strict";

      var log = require("./logger.js").default;

      log();
    },
    { "./logger.js": 1 }
  ],
  1: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = void 0;

      var _message = require("./message.js");

      var _default = function _default() {
        return console.log(_message.message);
      };

      exports.default = _default;
    },
    { "./message.js": 2 }
  ],
  2: [
    function(require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.message = void 0;
      var message = "Yo :\\";
      exports.message = message;
    },
    {}
  ]
});
