import { combineReducers } from 'redux';
import activeRequestsReducers from 'rdx/modules/activeRequests/reducers';
import appReducers from 'rdx/modules/app/reducers';
import routerReducers from 'rdx/modules/router/reducers';
import authReducers from 'rdx/modules/auth/reducers';
import messageReducers from 'rdx/modules/messages/reducers';
// IMPORT_PT (for script -- do not remove!)

export const reducers = {
  ...activeRequestsReducers,
  ...appReducers,
  ...routerReducers,
  ...authReducers,
  ...messageReducers,
// INSERTION_PT (for script -- do not remove!)
};

export default function compileReducers() {
  return combineReducers(reducers);
}
