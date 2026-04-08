const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 550,
        height: 600,
        webPreferences: {
            // This connects your HTML/JS to the computer's system
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load your HTML file
    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    // This listens for the button click from your script.js
    ipcMain.on('open-path', (event, filePath) => {
        // Electron's built-in 'shell' securely opens Finder or Explorer natively!
        shell.openPath(filePath);
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});