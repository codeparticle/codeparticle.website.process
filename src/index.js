import React from 'react';
import { render } from 'react-dom';
import App from './app/app';

const rootElement = document.getElementById('root');

render(<App />, rootElement);

if (module.hot) {
  module.hot.accept('./app/app', () => {
    const Application = require('./app/app');
    render(
      <Application />,
      rootElement
    );
  });
}
