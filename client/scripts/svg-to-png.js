const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'logo.svg');
const outDir = path.join(__dirname, '..', 'public');

const sizes = [
  { name: 'logo.webp', size: 512 },
  { name: 'logo-192.webp', size: 192 },
  { name: 'logo-512.webp', size: 512 },
];

(async () => {
  for (const { name, size } of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(path.join(outDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }
})();
