import React, { Fragment } from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';
import createHistory from 'history/createBrowserHistory';
import RootRouter from 'containers/root-router/root-router';
import configureStore from 'rdx/configure-store';
import registerServiceWorker from 'lib/register-service-worker';
import IntlProvider from 'containers/intl-provider/intl-provider';
import RootHelmet from 'containers/root-helmet/root-helmet';
import './app.scss';

const history = createHistory();

const { store, persistor } = configureStore(history);

const App = () => (
  <Provider store={store}>
    <IntlProvider>
      <PersistGate persistor={persistor}>
        <ConnectedRouter history={history}>
          <Fragment>
            <RootHelmet />
            <RootRouter />
          </Fragment>
        </ConnectedRouter>
      </PersistGate>
    </IntlProvider>
  </Provider>
);

registerServiceWorker();

export default App;
