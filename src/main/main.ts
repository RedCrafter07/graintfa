/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import express from 'express';
import chalk from 'chalk';
import cors from 'cors';
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';
import fs from 'fs';

import { resolveHtmlPath } from './util';
import { setFilePath, setState, setUnknown } from './lib/rpc';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

const db = new JsonDB(new Config('userData', true, false, '/'));

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon_big.png'),
    frame: false,
    webPreferences: {
      webSecurity: false,
    },
  });

  mainWindow.setIcon(getAssetPath('icon_big.png'));
  mainWindow.setMenu(null);

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.maximize();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

type Field = {
  x: number;
  y: number;
  name: string;
  selected: boolean;
  highlighted: boolean;
  id: number;
  size: number;
  image?: {
    opacity: number;
    path: string;
    saturation: boolean;
  };
  rename: boolean;
};

const server = express();

server.use(cors());

server.get('/assets/:asset', (req, res) => {
  const path = getAssetPath(req.params.asset);
  res.sendFile(path);
});

server.get('/program/close', (req, res) => {
  app.quit();
  res.status(200);
});
server.get('/program/maximize', (req, res) => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
  res.status(200);
});
server.get('/program/minimize', (req, res) => {
  mainWindow.minimize();
  res.status(200);
});

server.post('/save', async (req, res) => {
  const { fields: f, fieldindex: fi, filepath: fn } = req.headers;
  const fields: Field[] = JSON.parse(Array.isArray(f) ? f[0] : f);
  const fieldIndex: number = parseInt(Array.isArray(fi) ? fi[0] : fi);
  let filePath: string = Array.isArray(fn) ? fn[0] : fn;

  if (!filePath || filePath == undefined || filePath == 'undefined') {
    filePath = await dialog.showSaveDialogSync(mainWindow, {
      buttonLabel: 'Save',
      title: 'Save GUI',
      filters: [
        {
          extensions: ['rgraintf'],
          name: 'Graintfa file',
        },
      ],
      properties: ['showOverwriteConfirmation'],
    });
  }

  await fs.writeFileSync(
    filePath,
    JSON.stringify({
      fieldIndex: fieldIndex,
      fields: fields,
    })
  );

  res.status(200).json({ filePath });

  await addRecent(filePath);

  setFilePath(filePath);
});

server.get('/open', async (req, res) => {
  let filePath: string[] = Array.isArray(req.headers.filepath)
    ? req.headers.filepath
    : [req.headers.filepath];
  if (!filePath || filePath.includes('undefined'))
    filePath = await dialog.showOpenDialogSync(mainWindow, {
      buttonLabel: 'Open',
      title: 'Open a GUI',
      filters: [
        {
          extensions: ['rgraintf'],
          name: 'Graintfa file',
        },
      ],
      properties: ['openFile'],
    });

  const content = await fs.readFileSync(filePath[0], { encoding: 'utf8' });

  const parsedContent: {
    fieldIndex: number;
    fields: Field[];
  } = JSON.parse(content);

  res.status(200).json({ ...parsedContent, filePath: filePath[0] });

  await addRecent(filePath[0]);

  setFilePath(filePath[0]);
});

server.get('/openItemTexture', async (req, res) => {
  const filePath = await dialog.showOpenDialogSync(mainWindow, {
    buttonLabel: 'Load',
    title: 'Item texture',
    filters: [
      {
        extensions: ['png'],
        name: 'Minecraft texture file',
      },
    ],
    properties: ['openFile'],
  });

  res.status(200).json({ filePath });
});

server.get('/image/:path', async (req, res) => {
  const img = await fs.readFileSync(req.params.path).toString('base64');
  res.send(img);
});

server.get('/editor', (req, res) => {
  setUnknown();
  res.status(200);
});

server.get('/recent', async (req, res) => {
  let recent: string[] = [];
  try {
    recent = await db.getData('/recent');
  } catch (err) {
    recent = [];
    await db.push('/recent', []);
  }

  res.json(recent).status(200);

  setState('In the main menu');
});

server.get('/recent/clear', async (req, res) => {
  await db.push('/recent', []);
  res.status(200);
});

const defaultSettings: { path: string; value: number | string | boolean }[] = [
  {
    path: '/settings/theme',
    value: 'dark',
  },
  {
    path: '/settings/keepNavOpen',
    value: true,
  },
  {
    path: '/settings/centerNav',
    value: false,
  },
];

server.get('/settings', async (req, res) => {
  defaultSettings.forEach(async (s) => {
    if (!db.exists(s.path)) await db.push(s.path, s.value);
  });
  const d = await db.getData('/settings');

  res.status(200).json(d);
});

server.post('/settings', async (req, res) => {
  const s = JSON.parse(
    Array.isArray(req.headers.settings)
      ? req.headers.settings[0]
      : req.headers.settings
  );
  db.push('/settings', s);
  res.status(200);
});

server.post('/settings/default', async (req, res) => {
  db.push('/settings', {});
});

server.get('/theme', async (req, res) => {
  if (!db.exists('/settings/theme')) await db.push('/settings/theme', 'dark');
  const theme = await db.getData('/settings/theme');

  res.status(200).json(theme);
});

async function addRecent(filePath: string) {
  let recent: string[] = [];
  try {
    recent = await db.getData('/recent');
  } catch (err) {
    recent = [];
    await db.push('/recent', []);
  }

  if (recent.includes(filePath)) {
    recent.splice(recent.indexOf(filePath[0]), 1);
  }

  recent.push(filePath);

  await db.push('/recent', recent);
}

server.listen(736, () => {
  console.log(chalk.green('[SERVER]: Listening on port 736!'));
});
