const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('matatagDesktopApp', {
  platform: process.platform,
  version: '2.5.0-MATATAG',
  barangay: 'Barangay Matatag, Lamitan City, Basilan Province (BARMM 7302)',
  developer: 'Sam Pangilinan (ZETICUZ)',
});
