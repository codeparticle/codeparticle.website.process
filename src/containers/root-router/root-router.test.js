import React from 'react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { createMockStore } from 'redux-test-utils';
import configureStore from 'rdx/configure-store';
import createBrowserHistory from 'history/createBrowserHistory';
import Auth from 'containers/auth/auth';
import RootRouter from './root-router';

const history = createBrowserHistory();
const { store } = configureStore(history);
const mockStore = createMockStore({ ...store.getState() });

test('login path should render properly', () => {
  const wrapper = mountWithIntl(
    <Provider store={mockStore}>
      <MemoryRouter initialEntries={['/login']}>
        <RootRouter />
      </MemoryRouter>
    </Provider>
  );
  expect(wrapper.find(Auth)).toHaveLength(1);
});
