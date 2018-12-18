import React from 'react';
import PropTypes from 'prop-types';
import customPropTypes from 'lib/customPropTypes';
// import classNames from 'classnames';
import { connect } from 'react-redux';
import { Switch, Route } from 'react-router';
import { getRdxActionMapper, getRdxSelectionMapper } from 'rdx/utils/propsMapping';

import './index.css';

class TabNavigator extends React.Component {
  renderTabs(tabs) {
    const { navigate, baseUrl } = this.props;
    return tabs.map(tab => (
      <div
        className="tab"
        key={`${tab.slug}-tab`}
        role="presentation"
        onClick={() => {
          navigate(`${baseUrl}/${tab.slug}`);
        }}
      >
        {tab.name}
      </div>
    ));
  }

  renderRouter(tabs) {
    const { defaultTabId, baseUrl, location } = this.props;
    let defaultTab = tabs[0];
    const routes = tabs.map((tab) => {
      if (defaultTabId && (tab.slug === defaultTabId)) {
        defaultTab = tab;
      }
      const opts = tab.routeConfig || {};
      return (
        <Route
          key={`${tab.slug}-tab-container`}
          path={`${baseUrl}/${tab.slug}`}
          component={tab.component}
          {...opts}
        />
      );
    });
    const defaultOpts = defaultTab.routeConfig || {};
    const defaultRoute = (
      <Route
        key={`${defaultTab.slug}-default-tab-container`}
        path={`${baseUrl}/`}
        component={defaultTab.component}
        {...defaultOpts}
      />
    );
    return (
      <Switch location={location}>
        {routes}
        {defaultRoute}
      </Switch>
    );
  }

  render() {
    const { tabs } = this.props;
    return (
      <div className="tab-navigator-rct-component">
        <div className="tabs-container">
          {this.renderTabs(tabs)}
        </div>
        <div className="routes-container">
          {this.renderRouter(tabs)}
        </div>
      </div>
    );
  }
}

TabNavigator.propTypes = {
  baseUrl: PropTypes.string,
  navigate: PropTypes.func,
  location: customPropTypes.location,
  tabs: customPropTypes.tabs.isRequired,
  defaultTabId: PropTypes.string,
};

TabNavigator.defaultProps = {
  baseUrl: '',
  navigate: () => {},
  defaultTabId: '',
  location: null,
};

const actionsMapper = getRdxActionMapper([
  'navigate',
]);

const stateMapper = getRdxSelectionMapper({
  location: 'getLocation',
  currentQuery: 'getCurrentQuery',
});

export default connect(stateMapper, actionsMapper)(TabNavigator);
