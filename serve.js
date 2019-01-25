const micro = require("micro");
const { writeFile, watch } = require("./fs");
const { bundle, bundleAsset } = require("./index");
const Socket = require("socket.io");
const url = require("url");
const querystring = require("querystring");

const PORT = !isNaN(parseInt(process.env.PORT))
  ? parseInt(process.env.PORT)
  : 1234;

const server = micro(async req => {
  const { query: queryString } = url.parse(req.url);
  const query = querystring.parse(queryString);
  console.dir(query);
  if (query && query.id !== undefined) {
    console.log("bundling", query.id);
    const result = await bundleAsset("./example/" + query.id);
    console.log("Done Bundling", query.id);
    return result;
  } else {
    const result = await bundle("./example/index.js");
    writeFile("bundle.out.js", result);
    console.log("Done!");
    return `
  <body>
    <script>${result}</script>
    <script src="/socket.io/socket.io.js"></script>
  <script>
    var socket = io();
    socket.on("change", function(fileName) {
      var script = document.createElement("script");
      script.src = "/?id=" + encodeURIComponent(fileName);
      document.body.appendChild(script);
    })
  </script>
  </body>
  `;
  }
});

const io = Socket(server);
let throttleChange;
watch("./example", { recursive: true }, (_event, fileName) => {
  if (throttleChange) return;
  console.log("VHA:", fileName);
  throttleChange = setTimeout(() => {
    io.emit("change", fileName);
    throttleChange = null;
  }, 1000);
});

server.listen(PORT, () => console.log(`listening on localhost:${PORT}`));
