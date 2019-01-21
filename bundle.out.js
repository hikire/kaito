(function(modules) {
  function require(id) {
    var [fn, mapping] = modules[id];
    function localRequire(localFileName) {
      return require(mapping[localFileName]);
    }
    var exports = {};
    fn(localRequire, exports);
    return exports;
  }

  require(0);
})({
  0: [
    function(require, exports) {
      "use strict";

      var _logger = _interopRequireDefault(require("./logger.js"));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      (0, _logger.default)();
    },
    { "./logger.js": 1 }
  ],
  1: [
    function(require, exports) {
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
    function(require, exports) {
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
