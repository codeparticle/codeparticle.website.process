import React from 'react';
import { Switch, Route } from 'react-router';

import Main from 'containers/Main';
import Auth from 'containers/Auth';
import FlashMessages from 'containers/FlashMessages';
import AuthGuard from 'components/AuthGuard';
import NotFound from 'components/NotFound';

import './index.css';

const RootRouter = () => (
  <React.Fragment>
    <Switch>
      <Route exact path="/login" component={Auth} />
      <AuthGuard>
        <Main />
      </AuthGuard>
      <Route component={NotFound} />
    </Switch>
    <FlashMessages />
  </React.Fragment>
);

RootRouter.propTypes = {
};

RootRouter.defaultProps = {
};

export default RootRouter;
