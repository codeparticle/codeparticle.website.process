import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import uuidv1 from 'uuid/v1';
import parseFloatString from 'lib/utils/parseFloatString';
import isValidEmail from 'lib/utils/isValidEmail';
import formConnect from 'hocs/formConnect';

import './index.css';

class TextInput extends React.Component {
  constructor(props) {
    super(props);
    this.config = TextInput.getConfig(props.type);
    this.inputId = `text-input-${uuidv1()}`;
  }

  componentDidMount() {
    const { onChange, value } = this.props;
    // we do this to pass up initialError to formConnect (mostly for if required)
    onChange({ value, error: this.getError(value) });
  }

  onChange = (e) => {
    this.sendChangeEvent(e.target.value);
  }

  onBlur = (e) => {
    const { onBlur } = this.props;
    const { pipe } = this.config;
    if (pipe) {
      const value = pipe(e.target.value);
      this.sendChangeEvent(value);
      // this is hacky but -
      // the point is to make sure we sendChangeEvent before onBlur
      setTimeout(() => {
        onBlur();
      }, 0);
    } else {
      onBlur();
    }
  }

  getError = (value) => {
    const { required } = this.props;
    if (required && value.length < 1) return 'Value is required';
    return this.config.getError(value) || '';
  }


  sendChangeEvent = (value) => {
    const { onChange } = this.props;
    if (value.length > this.config.maxLength) return;
    const error = this.getError(value);
    onChange({
      value,
      error,
    });
  }

  render() {
    const {
      label,
      value,
      placeholder,
      className,
      labelClassName,
    } = this.props;
    return (
      <div className={classNames(
        'text-input-rct-component',
        className,
      )}
      >
        <label
          htmlFor={this.inputId}
          className={classNames(
            'input-label',
            labelClassName,
          )}
        >
          {label}
          <input
            className={classNames(
              this.config.className,
            )}
            id={this.inputId}
            placeholder={placeholder || this.config.placeholder}
            type={this.config.type}
            maxLength={this.config.maxLength}
            onChange={this.onChange}
            value={value}
            onBlur={this.onBlur}
          />
        </label>
      </div>
    );
  }
}

TextInput.getConfig = (type) => {
  switch (type) {
    case 'zip':
      return ({
        type: 'number',
        maxLength: 5,
        getError: (value) => {
          if (!value || value.replace(/\s/g, '').length !== 5) {
            return 'Please enter a 5 character zipcode';
          }
          return '';
        },
      });
    case 'text':
      return ({
        className: '',
        placeholder: '',
        type: 'text',
        getError: () => '',
      });
    case 'email':
      return ({
        className: '',
        placeholder: '',
        type: 'text',
        getError: (value) => {
          if (!isValidEmail(value)) {
            return 'Must be a valid email address';
          }
          return '';
        },
      });
    case 'password':
      return ({
        className: '',
        placeholder: '',
        type: 'password',
        getError: (value) => {
          if (value.length < 6) return 'Password must be at least 6 characters';
          if (value.length > 32) return 'Password must be over 32 characters';
          return '';
        },
      });
    case 'dollar':
      return ({
        className: '',
        placeholder: '',
        type: 'text',
        getError: () => '',
        pipe: (value) => {
          const float = parseFloatString(value);
          const formattedVal = float
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          return `$${formattedVal}`;
        },
      });
    default:
      return ({
        className: '',
        placeholder: '',
        getError: () => '',
      });
  }
};

TextInput.propTypes = {
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  value: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  required: PropTypes.bool,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  labelClassName: PropTypes.string,
};

TextInput.defaultProps = {
  onChange: () => {},
  onBlur: () => {},
  value: '',
  type: '',
  className: '',
  required: false,
  label: '',
  placeholder: '',
  labelClassName: '',
};

export const FormTextInput = formConnect(TextInput);

export default TextInput;
