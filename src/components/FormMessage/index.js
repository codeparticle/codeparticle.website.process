import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './index.css';

const FormMessage = (props) => {
  const { className, text, isError } = props;
  return (
    <div className={classNames(
      'form-message-rct-component',
      className,
      isError && 'error',
    )}
    >
      {text}
    </div>
  );
};

FormMessage.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  isError: PropTypes.bool,
};

FormMessage.defaultProps = {
  className: '',
  text: '',
  isError: true,
};

export default FormMessage;
