import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import FormMessage from 'components/FormMessage';
import uuidv1 from 'uuid/v1';
import stripObjectProps from 'lib/utils/stripObjectProps';

import './index.css';

/*
  for an input to be connected via this HOC
  it should take its value from props
  and importantly,
    when setting value via props.onChange,
    spec mandates child to argue ({ value, error })
*/

const formConnect = (InputComponent) => {
  class FormInput extends React.Component {
    constructor(props) {
      super(props);
      const value = props.initValue || '';
      this.formKey = props.formKey;
      this.prevContext = {};
      this.state = {
        showError: false,
        error: '',
        value,
        hasChanged: false,
      };
    }

    componentDidMount() {
      this.updateInputStatus();
    }

    componentDidUpdate(prevProps, prevState) {
      const { error, showError } = this.state;
      const { initValue } = this.props;
      const { forceShowFormErrorMoment } = this.context;
      if (prevState.error !== error) {
        this.updateInputStatus();
      }
      if (
        this.prevContext.forceShowFormErrorMoment
        && this.prevContext.forceShowFormErrorMoment !== forceShowFormErrorMoment
      ) {
        // new moment means directive from the form --> 'show your error if it exists'
        if (error && !showError) this.revealError();
      }
      // if new value bestowed upon form input, reset it
      if (prevProps.initValue !== initValue) {
        this.resetFormValue(initValue);
      }
      this.prevContext = this.context; // react does not give prevContext via component hooks
    }

    onChange = ({ value, error }) => {
      const prevValue = this.state.value; // eslint-disable-line
      const hasChanged = prevValue !== value;
      this.setState({
        value,
        error,
        hasChanged,
        // design choice to hide error while focused and changing
        showError: false,
      });
      this.updateInputStatus({ value, error, hasChanged });
    }

    updateInputStatus = ({ value, error, hasChanged } = {}) => {
      const { updateInputStatus } = this.context;
      const _value = value !== undefined ? value : this.state.value; // eslint-disable-line
      const _error = error !== undefined ? error : this.state.error; // eslint-disable-line
      const _hasChanged = hasChanged !== undefined ? hasChanged : this.state.hasChanged; // eslint-disable-line
      if (!updateInputStatus) return;
      updateInputStatus(this.formKey, { value: _value, error: _error, hasChanged: _hasChanged });
    }

    updateFormOnBlur = () => {
      const { showError, error } = this.state;
      const { dontShowErrorOnBlur } = this.props;
      this.updateInputStatus();
      if (!showError && error && !dontShowErrorOnBlur) this.setState({ showError: true });
    }

    revealError() {
      this.setState({ showError: true });
    }

    resetFormValue(value) {
      const error = '';
      const hasChanged = false;
      this.setState({
        showError: false,
        error,
        hasChanged,
        value,
      });
      this.updateInputStatus({ value, error, hasChanged });
    }

    renderInput = () => {
      const { showError, value, hasChanged } = this.state;
      const { required } = this.props;
      const childProps = stripObjectProps(this.props, Object.keys(FormInput.defaultProps));
      return (
        <InputComponent
          className={classNames(
            showError ? 'input-error' : '',
            hasChanged && 'input-changed',
          )}
          onChange={this.onChange}
          onBlur={this.updateFormOnBlur}
          value={value}
          required={required}
          {...childProps}
        />
      );
    }

    render() {
      const { showError, error } = this.state;
      const errorTxt = showError ? error : '';
      return (
        <div className={classNames(
          'form-connect-rct-component',
        )}
        >
          {this.renderInput()}
          <FormMessage
            text={errorTxt}
            isError
          />
        </div>
      );
    }
  }


  FormInput.contextTypes = {
    updateInputStatus: PropTypes.func,
    forceShowFormErrorMoment: PropTypes.number,
  };

  FormInput.propTypes = {
    initValue: PropTypes.string,
    formKey: PropTypes.string,
    required: PropTypes.bool,
    dontShowErrorOnBlur: PropTypes.bool,
  };

  FormInput.defaultProps = {
    initValue: '',
    formKey: uuidv1(),
    required: false,
    dontShowErrorOnBlur: false,
  };

  return FormInput;
};


export default formConnect;
