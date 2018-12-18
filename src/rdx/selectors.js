import activeRequestsSelectors from 'rdx/modules/activeRequests/selectors';
import appSelectors from 'rdx/modules/app/selectors';
import routerSelectors from 'rdx/modules/router/selectors';
import authSelectors from 'rdx/modules/auth/selectors';
import messageSelectors from 'rdx/modules/messages/selectors';
// IMPORT_PT (for script -- do not remove!)

const selectors = {
  ...activeRequestsSelectors,
  ...appSelectors,
  ...routerSelectors,
  ...authSelectors,
  ...messageSelectors,
// INSERTION_PT (for script -- do not remove!)
};

export default selectors;
