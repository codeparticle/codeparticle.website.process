import activeRequestsTypes from 'rdx/modules/activeRequests/types';
import appTypes from 'rdx/modules/app/types';
import routerTypes from 'rdx/modules/router/types';
import authTypes from 'rdx/modules/auth/types';
import messageTypes from 'rdx/modules/messages/types';
// IMPORT_PT (for script -- do not remove!)

const types = {
  ...activeRequestsTypes,
  ...appTypes,
  ...routerTypes,
  ...authTypes,
  ...messageTypes,
// INSERTION_PT (for script -- do not remove!)
};

export default types;
