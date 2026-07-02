import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../');

const directoriesToClean = [
  path.join(root, 'dist'),
  path.join(root, 'client/dist'),
  path.join(root, 'server/dist'),
  path.join(root, 'shared/dist'),
];

directoriesToClean.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`🧹 Cleaning directory: ${dir}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

console.log('✨ Cleanup completed successfully!');
