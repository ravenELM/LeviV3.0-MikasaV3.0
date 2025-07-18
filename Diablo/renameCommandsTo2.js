const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, 'commands');

function getAllCommandFiles(dir) {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getAllCommandFiles(full));
    } else if (file.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function getRenamedFilePath(filePath) {
  const dir = path.dirname(filePath);
  const originalName = path.basename(filePath, '.js');
  const nameParts = originalName.split('-');
  const baseName = nameParts.length > 1 ? nameParts.pop() : originalName;
  const newName = `${baseName}2.js`;
  return path.join(dir, newName);
}

const commandFiles = getAllCommandFiles(COMMANDS_DIR);
for (const file of commandFiles) {
  const newPath = getRenamedFilePath(file);
  if (newPath !== file) {
    fs.renameSync(file, newPath);
    console.log(`✅ Renamed: ${path.basename(file)} → ${path.basename(newPath)}`);
  }
}
