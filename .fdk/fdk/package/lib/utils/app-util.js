'use strict';

const fileUtil = require('./file-util');
const manifest = require('../manifest');

const appType = [];

function isPureBackend() {
  const appFolderPath = process.cwd() + '/app/';

  /*
    If the app is not a backend app, it can't be a pure backend app.
  */

  if (!manifest.features.includes('backend')) {
    return;
  }

  /*
    Even if one of the product contains location, it can't be a pure backend app.
  */
  if (Object.keys(manifest.product || {}).some(key => 'location' in manifest.product[key])) {
    return;
  }

  /*
    If the app has an app directory with files in it, it can't be a pure backend app.
  */
  if (fileUtil.fileExists(appFolderPath) && fileUtil.readDir(appFolderPath).length !== 0) {
    return;
  }

  return appType.push('purebackend');
}

function appClassifier() {
  [
    isPureBackend
  ].forEach(e => e());

  return appType;
}

module.exports = {
  appClassifier
};