const fs = require("node:fs");

// The `t` function (translation helper) is injected by @formio/core's normalizeContext
// into the evaluation context. isolated-vm uses the structured clone algorithm and cannot
// serialize functions, so `t` must be removed from the globals before they are copied
// into the VM sandbox. It is already re-injected inside the VM via modifyEnv, so
// removing it here does not affect translation behavior.
const patches = [
  {
    description: "initial filteredArgs",
    target: "let filteredArgs = args;",
    replacement: `\
      const { t: _t, ...filteredArgsWithoutT } = args || {};
      let filteredArgs = filteredArgsWithoutT;`,
  },
  {
    description: "instance filteredArgs",
    target: "filteredArgs = rest;",
    replacement: `\
        const { t: _t, ...restWithoutT } = rest || {};
        filteredArgs = restWithoutT;`,
  },
];

const file = "/formio/src/vm/index.js";
let patchedSource = fs.readFileSync(file, "utf8");

for (const { description, target, replacement } of patches) {
  const count = patchedSource.split(target).length - 1;
  if (count !== 1) {
    throw new Error(
      `Expected exactly one "${description}" statement, found ${count}.`,
    );
  }
  patchedSource = patchedSource.replace(target, replacement);
}

fs.writeFileSync(file, patchedSource);
