/**
 * componentExists
 *
 * Check whether the given component exist in either the components or containers directory
 */

const fs = require('fs');
const path = require('path');
const ducks = fs.readdirSync(path.join(__dirname, '../../../src/rdx/modules'));

function duckExists(comp) {
  return ducks.indexOf(comp) >= 0;
}

module.exports = duckExists;
