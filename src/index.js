import React from 'react';
import { render } from 'react-dom';
import App from './app';

const rootElement = document.getElementById('root');

render(<App />, rootElement);

if (module.hot) {
  module.hot.accept('./app', () => {
    const Application = require('./app');
    render(
      <Application />,
      rootElement
    );
  });
}
