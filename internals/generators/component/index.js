/**
 * Component Generator
 */

/* eslint strict: ["off"] */

'use strict';

const componentExists = require('../utils/componentExists');

module.exports = {
  description: 'Add a component',
  prompts: [{
    type: 'list',
    name: 'type',
    message: 'Select the type of component',
    default: 'Stateless Function',
    choices: () => ['Stateless Function', 'React.Component'],
  }, {
    type: 'input',
    name: 'name',
    message: 'What should it be called?',
    default: 'Button',
    validate: (value) => {
      if ((/.+/).test(value)) {
        return componentExists(value) ? 'A component or container with this name already exists' : true;
      }

      return 'The name is required';
    },
  }, {
    type: 'confirm',
    name: 'reduxConnected',
    default: false,
    message: 'Do you want to connect to redux?',
  }, {
    type: 'confirm',
    name: 'takesClassNameAsProp',
    default: false,
    message: 'Do you want it to take \'className\' as a prop?',
  }],
  actions: (data) => {
    const actions = [];
    // Generate index.js and index.test.js
    let componentTemplate;

    switch (data.type) {
      case 'Stateless Function': {
        componentTemplate = './component/stateless.js.hbs';
        break;
      }
      default: {
        componentTemplate = './shared/class.js.hbs';
      }
    }

    actions.push({
      type: 'add',
      path: '../../src/components/{{pascalCase name}}/index.js',
      templateFile: componentTemplate,
      abortOnFail: true,
    }, {
     type: 'add',
     path: '../../src/components/{{pascalCase name}}/index.scss',
     templateFile: './shared/index.scss.hbs',
     abortOnFail: true,
    // }, {
    //   type: 'add',
    //   path: '../../src/components/{{pascalCase name}}/index.spec.js',
    //   templateFile: './shared/test.js.hbs',
    //   abortOnFail: true,
    });

    return actions;
  },
};
