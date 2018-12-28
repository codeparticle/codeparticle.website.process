import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';
import createHistory from 'history/createBrowserHistory';
import RootRouter from 'containers/root-router';
import configureStore from 'rdx/configure-store';
import registerServiceWorker from 'lib/register-service-worker';
import './index.scss';

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

registerServiceWorker();

export default App;
