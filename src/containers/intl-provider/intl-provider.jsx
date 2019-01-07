import 'intl'; // required to use IntlProvider on android emulator, refer to: https://github.com/oursky/create-react-native-skygear/issues/26
import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

const ConnectedIntlProvider = props => (
  <IntlProvider {...props}>
    <div className={props.locale} style={{ height: '100%' }}>
      {props.children}
    </div>
  </IntlProvider>
);

const mapStateToProps = (state) => {
  const { lang, messages } = state.locale;
  return { locale: lang, key: lang, messages };
};

export default connect(mapStateToProps)(ConnectedIntlProvider);
