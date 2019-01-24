const micro = require("micro");
const { writeFile } = require("./fs");
const { bundle } = require("./index");

const PORT = !isNaN(parseInt(process.env.PORT))
  ? parseInt(process.env.PORT)
  : 1234;

const server = micro(async () => {
  const result = await bundle("./example/index.js");
  await writeFile("bundle.out.js", result);
  console.log("Done!");
  return `<script>${result}</script>`;
});

server.listen(PORT, () => console.log(`listening on localhost:${PORT}`));
