import { contextBridge } from 'electron';

const preload = {};

contextBridge.exposeInMainWorld('api', preload);

export type PreloadAPI = typeof preload;
