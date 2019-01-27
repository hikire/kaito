// import React from "react";
// import ReactDOM from "react-dom";
// const log = require("./logger.js").default;
// require("./extra");
// log();
// const root = document.getElementById("app") || document.createElement("div");
// root.id = "app";
// document.body.appendChild(root);
// ReactDOM.render(<h1>Yo!!!!</h1>, root);
if (process.env.NODE_ENV !== "production") {
  console.log("not production");
} else {
  console.log("production");
}

console.log("everywhere");
