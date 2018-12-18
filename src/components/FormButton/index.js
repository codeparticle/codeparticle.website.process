import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './index.css';

// must be React.Compoent to update on context changes
class FormButton extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const {
      className,
      text,
      onClick,
      validates,
      isSubmitButton,
      reflectFormChange,
      ...otherProps
    } = this.props;
    const { formIsValid, formHasChanged, onButtonPress } = this.context;
    return (
      <button
        className={classNames(
          'form-button-rct-component',
          !formIsValid && 'button-disabled',
          (formHasChanged && reflectFormChange) && 'button-changed',
          className,
        )}
        type={isSubmitButton ? 'submit' : 'button'}
        onClick={(e) => {
          onButtonPress({ e, validates, callback: onClick });
        }}
        {...otherProps}
      >
        {text}
      </button>
    );
  }
}

FormButton.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  onClick: PropTypes.func,
  validates: PropTypes.bool,
  isSubmitButton: PropTypes.bool,
  reflectFormChange: PropTypes.bool,
};

FormButton.defaultProps = {
  reflectFormChange: false,
  className: '',
  text: 'Submit',
  onClick: () => {},
  validates: true,
  isSubmitButton: false,
};

FormButton.contextTypes = {
  formIsValid: PropTypes.bool,
  formHasChanged: PropTypes.bool,
  onButtonPress: PropTypes.func,
};

export default FormButton;
