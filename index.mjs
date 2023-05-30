import vm from "node:vm";
import fs from "node:fs";

// a slimmed down version (for brevity) of jest's LeakDetector https://github.com/jestjs/jest/blob/6d2632a/packages/jest-leak-detector/src/index.ts
class LeakDetector {
  constructor(value) {
    if (!globalThis.gc) {
      throw new Error(
        "Garbage Collector is not exposed, please run Node with `--expose-gc`"
      );
    }

    // When `finReg` is GCed the callback we set will no longer be called,
    this.finReg = new FinalizationRegistry(() => {
      this.isRefHeld = false;
    });
    this.finReg.register(value, undefined);

    this.isRefHeld = true;

    // Ensure value is not leaked by the closure created by the "weak" callback.
    value = null;
  }

  async isLeaking() {
    globalThis.gc();

    // wait some ticks to allow GC to run properly, see https://github.com/nodejs/node/issues/34636#issuecomment-669366235
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setImmediate(resolve));
    }

    return this.isRefHeld;
  }
}

(async function main() {
  const filename = "test.js";
  const src = fs.readFileSync(filename);
  const script = new vm.Script(src.toString(), { filename });

  let ctx = { ...globalThis };
  const detector = new LeakDetector(ctx);
  await script.runInNewContext(ctx);
  ctx = null;

  if (await detector.isLeaking()) {
    console.error("LEAKING");
    process.exit(1);
  }
  console.log("OK");
})();
