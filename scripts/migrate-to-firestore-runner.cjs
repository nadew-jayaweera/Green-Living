process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "node",
  esModuleInterop: true,
});

require("ts-node/register/transpile-only");
require("./migrate-to-firestore.ts");
