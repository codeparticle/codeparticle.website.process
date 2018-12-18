import React from 'react';
import PropTypes from 'prop-types';
import customPropTypes from 'lib/customPropTypes';
import { connect } from 'react-redux';
import { getRdxActionMapper, getRdxSelectionMapper } from 'rdx/utils/propsMapping';
import uuidv1 from 'uuid/v1';

import { activeRequestExists } from 'rdx/modules/activeRequests/selectors';
import { areDataPtsValid, getComponentStateMappers } from 'hocs/utils/resolverData';

import './index.css';

class Resolver extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      queryParamDataPt: null,
    };
    this.doneResolving = false;
    // cache dataPts
    this.dataPts = props.dataPts;
    this.dataCache = {};
    this.trackedActiveReqs = [];
  }

  componentDidMount() {
    this.resetTimeout();
    this.dispatchDataRequests();
  }

  componentDidUpdate(prevProps) {
    const { currentQuery } = this.props;
    const { queryParamDataPt } = this.state;
    if ((prevProps.currentQuery !== currentQuery) && queryParamDataPt) {
      this.dispatchReqWithNewQuery();
    }
  }

  resetTimeout() {
    const { timeoutInSecs } = this.props;
    this.doneResolving = false;
    setTimeout(() => {
      // timeout resolver to minimize processor overhead, guard against uncollected activeRequest
      this.doneResolving = true;
    }, timeoutInSecs * 1000);
  }

  dispatchReqWithNewQuery() {
    const { currentQuery } = this.props;
    const { queryParamDataPt } = this.state;
    const dataPt = queryParamDataPt;
    const requestActionName = dataPt.requestAction;
    const action = this.props[requestActionName]; // eslint-disable-line
    if (action) {
      const reqId = uuidv1();
      action(currentQuery, reqId);
      const dpIdx = this.dataPts.findIndex(dp => dp.propKey === dataPt.propKey);
      if (dpIdx >= 0) this.dataPts.reqId = reqId;
    }
    this.resetTimeout();
  }

  dispatchDataRequests() {
    const { currentQuery } = this.props;
    const { queryParamDataPt } = this.state;
    for (let i = 0; i < this.dataPts.length; i += 1) {
      const dataPt = this.dataPts[i];
      const requestActionName = dataPt.requestAction;
      const action =  this.props[requestActionName]; // eslint-disable-line
      // check if action has been succesfully mapped to props
      if (action) {
        // check if data exists (ASSUMES falsiness applies)
        if (!this.props[dataPt.propKey] || dataPt.requestAgainIfCached) {  // eslint-disable-line
          const reqId = uuidv1();
          // trigger request
          let actionObj = {};
          if (dataPt.resolveWithQuery) {
            if (queryParamDataPt) {
              console.warn('multiple dataPts directed to resolve with query, only the last will be used');
            }
            actionObj = currentQuery;
            this.setState({ queryParamDataPt: dataPt });
          }
          action(actionObj, reqId);
          // attach reqId to dataPt
          this.dataPts[i].reqId = reqId;
        }
      }
    }
  }

  updateDataAndTrackedReqs() {
    const { activeRequests, loadingView } = this.props;
    const data = {};
    const trackedActiveReqs = [];
    for (let i = 0; i < this.dataPts.length; i += 1) {
      // assemble data
      const dataPt = this.dataPts[i];
      const { propKey } = dataPt;
      data[propKey] = this.props[propKey];  // eslint-disable-line
      if (loadingView !== 'show-component') {
        // we only track this if we might need info to hide component
        const reqActive = activeRequestExists({
          activeRequests,
          id: dataPt.reqId,
        });
        if (reqActive) trackedActiveReqs.push(dataPt);
      }
    }
    this.dataCache = data;
    this.trackedActiveReqs = trackedActiveReqs;
    return data;
  }


  renderLoadingView() {
    const { loadingView } = this.props;
    if (loadingView === 'none') return null;
    // if (loadingView === 'spinner') return SomethingSpinning;
    return null;
  }

  render() {
    const { WrappedComponent, componentProps, loadingView } = this.props;
    if (!this.doneResolving) {
      // udpates this.dataCache && this.trackedActiveReqs
      this.updateDataAndTrackedReqs();
      if (this.trackedActiveReqs.length > 0 && loadingView !== 'show-component') {
        return this.renderLoadingView();
      }
    }
    return (
      <WrappedComponent
        {...componentProps}
        {...this.dataCache}
      />
    );
  }
}

const loadingViewOpts = ['show-component', 'spinner', 'none'];
const dataPtShape = PropTypes.shape({
  requestAction: PropTypes.string.isRequired,
  selectorKey: PropTypes.string.isRequired,
  propKey: PropTypes.string.isRequired,
  // options
  requestAgainIfCached: PropTypes.bool,
  resolveWithQuery: PropTypes.bool,
}).isRequired;

Resolver.propTypes = {
  WrappedComponent: PropTypes.func.isRequired,
  activeRequests: customPropTypes.activeRequests.isRequired,
  currentQuery: PropTypes.object.isRequired, // eslint-disable-line
  componentProps: PropTypes.object, // eslint-disable-line
  dataPts: PropTypes.arrayOf(dataPtShape).isRequired,
  // // options
  loadingView: PropTypes.oneOf(loadingViewOpts),
  timeoutInSecs: PropTypes.number,
};

Resolver.defaultProps = {
  loadingView: 'none',
  componentProps: {},
  timeoutInSecs: 10,
};

const resolveData = (WrappedComponent, dataPts, options = {}) => {
  if (!areDataPtsValid(dataPts)) return WrappedComponent;
  const actionKeys = [dataPts.map(d => d.requestAction)];
  const actionsMapper = getRdxActionMapper(actionKeys);
  const stateMapper = getRdxSelectionMapper(getComponentStateMappers(dataPts));
  const ConnectedResolver = connect(stateMapper, actionsMapper)(Resolver);
  return componentProps => (
    <ConnectedResolver
      WrappedComponent={WrappedComponent}
      componentProps={componentProps}
      dataPts={dataPts}
      {...options}
    />
  );
};

export default resolveData;
