/**
 * Duck Generator
 */

/* eslint strict: ["off"] */

'use strict';

const duckExists = require('../utils/duckExists');
const integrateDuck = require('../utils/integrateDuck');

module.exports = {
  description: 'Add a redux module',
  prompts: [{
    type: 'input',
    name: 'name',
    message: 'What should it be called?',
    default: 'user',
    validate: (value) => {
      if ((/.+/).test(value)) {
        return duckExists(value) ? 'A duck with this name already exists' : true;
      }

      return 'The name is required';
    },
  }, {
    type: 'confirm',
    name: 'hasSagas',
    default: true,
    message: 'Should this duck have sagas?',
  }],
  actions: (data) => {
    const actions = [];
    // create files in rdx/module
    actions.push({
      type: 'add',
      path: '../../src/rdx/modules/{{ camelCase name}}/actions.js',
      templateFile: './duck/actions.js.hbs',
      abortOnFail: true,
    }, {
    //  type: 'add',
    //  path: '../../src/rdx/modules/{{ camelCase name}}/index.js',
    //  templateFile: './duck/index.js.hbs',
    //  abortOnFail: true,
    // }, {
      type: 'add',
      path: '../../src/rdx/modules/{{ camelCase name}}/reducers.js',
      templateFile: './duck/reducers.js.hbs',
      abortOnFail: true,
    }, {
      type: 'add',
      path: '../../src/rdx/modules/{{ camelCase name}}/selectors.js',
      templateFile: './duck/selectors.js.hbs',
      abortOnFail: true,
    }, {
      type: 'add',
      path: '../../src/rdx/modules/{{ camelCase name}}/types.js',
      templateFile: './duck/types.js.hbs',
      abortOnFail: true,
    });
    // integrate into rdx root files
    integrateDuck(data.name, 'actions');
    integrateDuck(data.name, 'reducers');
    integrateDuck(data.name, 'selectors');
    integrateDuck(data.name, 'types');

    if (data.hasSagas) {
      actions.push({
        type: 'add',
        path: '../../src/rdx/modules/{{ camelCase name}}/sagas/index.js',
        templateFile: './duck/sagas.index.js.hbs',
        abortOnFail: true,
      }, {
        type: 'add',
        path: '../../src/rdx/modules/{{ camelCase name}}/sagas/get{{ pascalCase name }}.js',
        templateFile: './duck/sagas.example.js.hbs',
        abortOnFail: true,
      })
      integrateDuck(data.name, 'sagas');
    }

    return actions;
  },
};
