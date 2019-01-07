import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router';
import NotFound from 'components/not-found/not-found';
import './main.scss';

class Main extends Component {
  static renderMainRouter() {
    return (
      <Switch>
        <Route
          path="/"
          exact
          component={() => (
            <div>
              welcome to the app
            </div>
          )}
        />
        <Route component={NotFound} />
      </Switch>
    );
  }

  render() {
    return (
      <div className="main-rct-component">
        {Main.renderMainRouter()}
      </div>
    );
  }
}

Main.propTypes = {
};

Main.defaultProps = {
};


export default Main;
