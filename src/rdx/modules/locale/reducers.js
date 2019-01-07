import moment from 'moment';
import createReducer from 'rdx/utils/create-reducer';
import types from 'rdx/modules/locale/types';
import { localeData } from '../../../translations/locale-data';

const DEFAULT_LOCALE = localeData['en'];

export default {
  locale: createReducer({
    lang: DEFAULT_LOCALE.lang,
    messages: DEFAULT_LOCALE.messages,
  },
  {
    [types.SET_LOCALE](state, action) {
      const mergedLocaleData = action.locale ? localeData[action.locale] : DEFAULT_LOCALE;
      const mergedMessages = Object.assign({}, DEFAULT_LOCALE.messages, mergedLocaleData.messages);
      moment.locale(action.locale);

      return { lang: mergedLocaleData.lang, messages: mergedMessages };
    },
  }),
};
