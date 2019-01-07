import { combineReducers } from 'redux';
import activeRequestsReducers from 'rdx/modules/active-requests/reducers';
import appReducers from 'rdx/modules/app/reducers';
import routerReducers from 'rdx/modules/router/reducers';
import authReducers from 'rdx/modules/auth/reducers';
import messageReducers from 'rdx/modules/messages/reducers';
import localeReducers from 'rdx/modules/locale/reducers';
// IMPORT_PT (for script -- do not remove!)

export const reducers = {
  ...activeRequestsReducers,
  ...appReducers,
  ...routerReducers,
  ...authReducers,
  ...messageReducers,
  ...localeReducers,
// INSERTION_PT (for script -- do not remove!)
};

export default function compileReducers() {
  return combineReducers(reducers);
}
