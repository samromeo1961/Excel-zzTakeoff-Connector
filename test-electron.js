console.log('Test: Loading electron module...');
const electron = require('electron');
console.log('Test: electron type =', typeof electron);
console.log('Test: electron.app type =', typeof electron.app);

if (electron.app) {
  console.log('SUCCESS: Electron API loaded correctly');
  electron.app.quit();
} else {
  console.log('FAIL: Electron API not available');
  process.exit(1);
}
