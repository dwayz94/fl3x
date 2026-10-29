// Rasterizes the app icon for browsers and phones (run by brand-logo.py, uses the API's sharp).
// Writes: app/favicon.ico (16/32/48), app/apple-icon.png (180, full bleed), public/icon-192.png, public/icon-512.png.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "web");
const tile = readFileSync(join(root, "public", "brand", "fl3x-app-icon.svg"));
// iOS rounds the corners itself: square background, same bag.
const square = Buffer.from(tile.toString().replace('rx="112"', 'rx="0"'));
const png = (svg, size) => sharp(svg, { density: 300 }).resize(size, size).png().toBuffer();

const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(tile, s)));
// ICO: 6-byte header, one 16-byte entry per image, then the PNGs.
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(sizes[i], e);
  header.writeUInt8(sizes[i], e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
writeFileSync(join(root, "src", "app", "favicon.ico"), Buffer.concat([header, ...images]));
writeFileSync(join(root, "src", "app", "apple-icon.png"), await png(square, 180));
writeFileSync(join(root, "public", "icon-192.png"), await png(tile, 192));
writeFileSync(join(root, "public", "icon-512.png"), await png(tile, 512));
console.log("favicon.ico, apple-icon.png, icon-192.png, icon-512.png");
