// Generates the NSIS installer sidebar bitmap (164x314 BMP, required format
// for installerSidebar/uninstallerSidebar) and the installer .ico icons.
// Run with: node scripts/build-installer-assets.mjs

import sharp from 'sharp';
import pngToIcoModule from 'png-to-ico';
import fs from 'fs';
import path from 'path';

const pngToIco = typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

const SIDEBAR_W = 164;
const SIDEBAR_H = 314;
const MAROON = { r: 0x7a, g: 0x23, b: 0x30 };
const BLUSH = '#FBF1EE';

async function buildSidebar() {
  // The logo's strokes are a dark maroon tone, which has poor contrast against
  // the maroon sidebar background — recolor to white using its alpha as a mask.
  const LOGO_SIZE = 72;
  const { data: rgba } = await sharp('public/logo-512.png')
    .resize(LOGO_SIZE, LOGO_SIZE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const whiteVersion = Buffer.alloc(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    whiteVersion[i] = 255;
    whiteVersion[i + 1] = 255;
    whiteVersion[i + 2] = 255;
    whiteVersion[i + 3] = rgba[i + 3]; // keep original alpha
  }
  const logo = await sharp(whiteVersion, { raw: { width: LOGO_SIZE, height: LOGO_SIZE, channels: 4 } })
    .png()
    .toBuffer();

  const textSvg = Buffer.from(`
    <svg width="${SIDEBAR_W}" height="120" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="38" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#FFFFFF">Orchestra</text>
      <text x="50%" y="62" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="${BLUSH}">-Core</text>
      <text x="50%" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${BLUSH}" opacity="0.85">Private AI financial</text>
      <text x="50%" y="106" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${BLUSH}" opacity="0.85">literacy coach</text>
    </svg>
  `);

  const background = sharp({
    create: { width: SIDEBAR_W, height: SIDEBAR_H, channels: 3, background: MAROON },
  });

  const composed = await background
    .composite([
      { input: logo, top: 56, left: Math.round((SIDEBAR_W - 72) / 2) },
      { input: textSvg, top: 150, left: 0 },
    ])
    .flatten({ background: MAROON })
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log('Composed buffer channels:', composed.info.channels, 'size:', composed.data.length);

  writeBmp(composed.data, SIDEBAR_W, SIDEBAR_H, composed.info.channels, 'build/installerSidebar.bmp');
  console.log('Wrote build/installerSidebar.bmp');
}

// sharp doesn't encode BMP, so the raw pixel buffer is wrapped in a
// hand-built BITMAPFILEHEADER + BITMAPINFOHEADER (standard uncompressed
// 24bpp BMP). srcChannels is whatever sharp actually produced (3 or 4) -
// only the first 3 bytes of each pixel (R,G,B) are used either way.
function writeBmp(srcBuffer, width, height, srcChannels, outPath) {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows are padded to 4-byte boundaries
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buf = Buffer.alloc(fileSize);
  // BITMAPFILEHEADER (14 bytes)
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10); // pixel data offset

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, 14); // header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive = bottom-up row order
  buf.writeUInt16LE(1, 26); // planes
  buf.writeUInt16LE(24, 28); // bits per pixel
  buf.writeUInt32LE(0, 30); // no compression
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38); // ~72 DPI
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  // Pixel data: BMP rows go bottom-to-top, BGR byte order, padded to 4 bytes
  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y; // flip vertically
    const destOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const srcIdx = (srcRow * width + x) * srcChannels;
      const destIdx = destOffset + x * 3;
      buf[destIdx] = srcBuffer[srcIdx + 2];     // B
      buf[destIdx + 1] = srcBuffer[srcIdx + 1]; // G
      buf[destIdx + 2] = srcBuffer[srcIdx];     // R
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
}

async function buildIco() {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const buffers = await Promise.all(
    sizes.map((s) => sharp('public/logo-512.png').resize(s, s).png().toBuffer())
  );
  const ico = await pngToIco(buffers);
  fs.writeFileSync('build/icon.ico', ico);
  console.log('Wrote build/icon.ico');
}

await buildSidebar();
await buildIco();
