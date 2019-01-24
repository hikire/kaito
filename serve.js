const micro = require("micro");
const { writeFile } = require("./fs");
const { bundle } = require("./index");

const PORT = !isNaN(parseInt(process.env.PORT))
  ? parseInt(process.env.PORT)
  : 1234;

const server = micro(async () => {
  const result = await bundle("./example/index.js");
  writeFile("bundle.out.js", result);
  console.log("Done!");
  return `
  <body>
    <script>${result}</script>
  </body>
  `;
});

server.listen(PORT, () => console.log(`listening on localhost:${PORT}`));
