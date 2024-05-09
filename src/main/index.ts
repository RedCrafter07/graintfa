import { BrowserWindow, app, screen, shell } from 'electron';
import path from 'path';

const env = process.env.NODE_ENV || 'production';

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;

	mainWindow = new BrowserWindow({
		minWidth: 1200,
		minHeight: 800,
		width: (width / 6) * 5,
		height: (height / 6) * 5,
		center: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
		show: false,
		title: 'Redify | Loading...',
	});

	if (env != 'production') {
		mainWindow.loadURL('http://localhost:8080/');
	} else {
		mainWindow.setMenu(null);
		mainWindow.loadURL(
			`file://${path.join(__dirname, '..', 'renderer', 'index.html')}`,
		);
	}

	mainWindow.on('close', () => {
		mainWindow = null;
	});

	mainWindow.once('ready-to-show', () => {
		mainWindow?.show();
	});

	// open links in default browser

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});
}

app.on('ready', () => {
	console.log('Hello, Electron!');

	createMainWindow();
});
