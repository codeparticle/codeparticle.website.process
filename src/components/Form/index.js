import React, { Children } from 'react';
import PropTypes from 'prop-types';
import customPropTypes from 'lib/customPropTypes';

import { messageTypes } from 'rdx/modules/messages/constants';

import FormMessage from 'components/FormMessage';

import './index.css';

const BYPASS_FORM_VALIDATION = process.env.REACT_APP_BYPASS_FORM_VALIDATION;

class Form extends React.Component {
  state = {
    inputs: {},
    showInputErrorsMoment: new Date().getTime(),
    formMessage: { text: '' },
  }

  getChildContext = () => {
    const { showInputErrorsMoment } = this.state;
    return ({
      formIsValid: this.formStatus.isValid,
      formHasChanged: this.formStatus.hasChanged,
      updateInputStatus: this.updateInputStatus,
      forceShowFormErrorMoment: showInputErrorsMoment,
      onButtonPress: this.onButtonPress,
    });
  }

  componentDidMount() {
    this.checkForDuplicateKeys();
  }

  shouldComponentUpdate(nextProps) {
    const { message } = this.props;
    if (nextProps.message.id !== message.id) {
      this.revealMessage(nextProps.message);
      return false;
    }
    return true;
  }

  onButtonPress = ({ e, validates, callback }) => {
    e.preventDefault();
    if (validates && !this.formStatus.isValid && !BYPASS_FORM_VALIDATION) {
      this.setState({ showInputErrorsMoment: new Date().getTime() });
    } else {
      this.executeWithInputData(callback);
    }
  }

  get formStatus() {
    const { inputs } = this.state;
    const formStatus = { isValid: true, hasChanged: false };
    const keys = Object.keys(inputs);
    for (let i = 0; i < keys.length; i += 1) {
      if (inputs[keys[i]].error) formStatus.isValid = false;
      if (inputs[keys[i]].hasChanged) formStatus.hasChanged = true;
    }
    return formStatus;
  }

  checkForDuplicateKeys = () => {
    const { children } = this.props;
    // check for dupe keys
    const formKeys = {};
    Children.forEach(children, (child) => {
      const { formKey } = child.props;
      if (formKeys[formKey]) {
        console.warn(`FormKey "${formKey}" used multiple times in the same form; keys must be unique.`);
        // TODO alert corresponding child, have it add UUID to formKey
      }
      if (formKey) formKeys[formKey] = true;
    });
  }


  updateInputStatus = (key, { value, error, hasChanged }) => {
    const { inputs, formMessage } = this.state;
    const newState = Object.assign(inputs,
      { [key]: { error, value, hasChanged } },
    );
    if (formMessage) newState.formMessage = '';
    this.setState(newState);
  }

  executeWithInputData(callback) {
    const { inputs, formMessage } = this.state;
    const data = {};
    const keys = Object.keys(inputs);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      data[key] = inputs[key].value;
    }
    if (formMessage.text) this.setState({ formMessage: { text: '' } });
    callback(data);
  }


  revealMessage(message) {
    this.setState({ formMessage: message });
  }

  render() {
    const { className, children } = this.props;
    const { formMessage } = this.state;
    const isError = formMessage.type === messageTypes.ERROR;
    return (
      <form
        className={`form-rct-component ${className}`}
      >
        {children}
        <FormMessage
          text={formMessage.text || ''}
          isError={isError}
        />
      </form>
    );
  }
}


Form.childContextTypes = {
  formIsValid: PropTypes.bool,
  updateInputStatus: PropTypes.func,
  forceShowFormErrorMoment: PropTypes.number,
  onButtonPress: PropTypes.func,
  formHasChanged: PropTypes.bool,
};

Form.propTypes = {
  className: PropTypes.string,
  message: customPropTypes.message,
  children: customPropTypes.children,
};

Form.defaultProps = {
  message: {},
  className: '',
  children: null,
};

export default Form;
