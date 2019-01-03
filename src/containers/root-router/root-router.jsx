import React, { Fragment } from 'react';
import { Switch, Route } from 'react-router';
import Main from 'containers/main/main';
import Auth from 'containers/auth/auth';
import FlashMessages from 'containers/flash-messages/flash-messages';
import AuthGuard from 'components/auth-guard/auth-guard';
import NotFound from 'components/not-found/not-found';
import './root-router.scss';

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
