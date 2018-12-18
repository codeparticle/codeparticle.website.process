import activeRequestsActions from 'rdx/modules/activeRequests/actions';
import appActions from 'rdx/modules/app/actions';
import routerActions from 'rdx/modules/router/actions';
import authActions from 'rdx/modules/auth/actions';
import messageActions from 'rdx/modules/messages/actions';
// IMPORT_PT (for script -- do not remove!)

const actions = {
  ...activeRequestsActions,
  ...appActions,
  ...routerActions,
  ...authActions,
  ...messageActions,
// INSERTION_PT (for script -- do not remove!)
};

export default actions;
