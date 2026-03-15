const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const SAVE_DIR = path.join(app.getPath('userData'), 'saves');
const SAVE_FILE = path.join(SAVE_DIR, 'aiTycoon.json');

module.exports = {
  save(data) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
    const tmp = SAVE_FILE + '.tmp';
    fs.writeFileSync(tmp, data, 'utf-8');
    fs.renameSync(tmp, SAVE_FILE);
  },
  load() {
    try { return fs.readFileSync(SAVE_FILE, 'utf-8'); }
    catch { return null; }
  },
  remove() {
    try { fs.unlinkSync(SAVE_FILE); } catch (e) { console.error('Save delete failed:', e.message); }
  }
};
