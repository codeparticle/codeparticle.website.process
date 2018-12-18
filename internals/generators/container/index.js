/**
 * Container Generator
 */

const componentExists = require('../utils/componentExists');

module.exports = {
  description: 'Add a container component',
  prompts: [
  {
    type: 'input',
    name: 'name',
    message: 'What should it be called?',
    default: 'Form',
    validate: (value) => {
      if ((/.+/).test(value)) {
        return componentExists(value) ? 'A component or container with this name already exists' : true;
      }

      return 'The name is required';
    },
  }, {
    type: 'confirm',
    name: 'reduxConnected',
    default: true,
    message: 'Do you want to connect to redux?',
  // }, {
  //   type: 'confirm',
  //   name: 'takesClassNameAsProp',
  //   default: false,
  //   message: 'Do you want it to take \'className\' as a prop?',
  }],
  actions: (data) => {
    // Generate index.js and index.test.js
    const actions = [{
      type: 'add',
      path: '../../src/containers/{{pascalCase name}}/index.js',
      templateFile: './shared/class.js.hbs',
      abortOnFail: true,
    // }, {
    //   type: 'add',
    //   path: '../../src/containers/{{pascalCase name}}/index.spec.js',
    //   templateFile: './shared/test.js.hbs',
    //   abortOnFail: true,
    }, {
      type: 'add',
      path: '../../src/containers/{{pascalCase name}}/index.scss',
      templateFile: './shared/index.scss.hbs',
      abortOnFail: true,
    }];

    return actions;
  },
};
