const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const SaveManager = require('./save-manager');

let mainWindow;
app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 430, height: 800,
    minWidth: 360, minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  mainWindow.loadFile('index.html');

  ipcMain.handle('save-game', (_, data) => SaveManager.save(data));
  ipcMain.handle('load-game', () => SaveManager.load());
  ipcMain.handle('delete-game', () => SaveManager.remove());
});
app.on('window-all-closed', () => app.quit());
