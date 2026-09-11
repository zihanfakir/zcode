import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZCodeEncoder, ZCodeRenderer } from "../dist/src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.resolve(__dirname, "../../samples");

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

const encoder = new ZCodeEncoder();

// 1. "Hello Zihan"
const zihanData = encoder.encode("Hello Zihan");
const zihanSvg = ZCodeRenderer.renderToSVG(zihanData, { size: 1024, margin: 48 });
fs.writeFileSync(path.join(samplesDir, "hello_zihan.svg"), zihanSvg, "utf-8");
console.log("Generated samples/hello_zihan.svg");

// 2. "https://example.com"
const urlData = encoder.encode("https://example.com");
const urlSvg = ZCodeRenderer.renderToSVG(urlData, { size: 1024, margin: 48 });
fs.writeFileSync(path.join(samplesDir, "example_url.svg"), urlSvg, "utf-8");
console.log("Generated samples/example_url.svg");

// 3. Password protected: "Hello Zihan" with password "zihan123"
const lockedData = await encoder.encode("Hello Zihan", { password: "zihan123" });
const lockedSvg = ZCodeRenderer.renderToSVG(lockedData, { size: 1024, margin: 48 });
fs.writeFileSync(path.join(samplesDir, "locked_secret.svg"), lockedSvg, "utf-8");
console.log("Generated samples/locked_secret.svg");

