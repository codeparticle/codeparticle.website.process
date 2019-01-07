import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import customPropTypes from 'lib/custom-prop-types';
import { connect } from 'react-redux';
import { getRdxActionMapper, getRdxSelectionMapper } from 'rdx/utils/props-mapping';
import Form from 'components/form/form';
import { FormTextInput } from 'components/text-input/text-input';
import FormButton from 'components/form-button/form-button';
import './auth.scss';

class Auth extends PureComponent {
  render() {
    const { requestLogin, loginMessage } = this.props;
    return (
      <div className="auth-rct-component g-auth-form-container">
        <Form
          className="form"
          message={loginMessage}
        >
          <FormTextInput
            className="input"
            placeholder=""
            label="Email"
            labelClassName="input-label"
            formKey="email"
            type="email"
            required
          />
          <FormTextInput
            className="input"
            placeholder=""
            label="Password"
            labelClassName="input-label"
            formKey="password"
            type="password"
            required
          />
          <div className="button-container">
            <FormButton
              className="submit-button"
              text="Login"
              isSubmitButton
              onClick={requestLogin}
            />
          </div>
        </Form>
      </div>
    );
  }
}

Auth.propTypes = {
  requestLogin: PropTypes.func.isRequired,
  loginMessage: customPropTypes.message,
};

Auth.defaultProps = {
  loginMessage: {},
};

const actionsMapper = getRdxActionMapper([
  'requestLogin',
]);

const stateMapper = getRdxSelectionMapper({
  loginMessage: 'getLatestLoginMessageEvt',
});

export default connect(stateMapper, actionsMapper)(Auth);
