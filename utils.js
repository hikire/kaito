const { inspect: rawInspect } = require("util");

function inspect(...vals) {
  console.log(
    ...vals.map(v =>
      rawInspect(v, { compact: false, depth: 5, breakLength: 80 })
    )
  );
}

module.exports = { inspect };
