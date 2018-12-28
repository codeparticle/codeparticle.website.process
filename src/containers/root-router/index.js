import React, { Fragment } from 'react';
import { Switch, Route } from 'react-router';
import Main from 'containers/main';
import Auth from 'containers/auth';
import FlashMessages from 'containers/flash-messages';
import AuthGuard from 'components/auth-guard';
import NotFound from 'components/not-found';
import './index.scss';

const RootRouter = () => (
  <Fragment>
    <Switch>
      <Route exact path="/login" component={Auth} />
      <AuthGuard>
        <Main />
      </AuthGuard>
      <Route component={NotFound} />
    </Switch>
    <FlashMessages />
  </Fragment>
);

RootRouter.propTypes = {
};

RootRouter.defaultProps = {
};

export default RootRouter;
