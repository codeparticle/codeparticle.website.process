import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';
import createHistory from 'history/createBrowserHistory';

import RootRouter from 'containers/RootRouter';
import configureStore from 'rdx/configureStore';
import registerServiceWorker from 'lib/registerServiceWorker';

import './index.css';

const history = createHistory();

const { store, persistor } = configureStore(history);

const App = () => (
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <ConnectedRouter history={history}>
        <RootRouter />
      </ConnectedRouter>
    </PersistGate>
  </Provider>
);


ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
