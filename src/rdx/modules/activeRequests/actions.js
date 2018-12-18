import types from 'rdx/modules/activeRequests/types';
import createAction from 'rdx/utils/createAction';

export default {
  addActiveRequest: payload => createAction(types.ADD_ACTIVE_REQUEST, payload),
  removeActiveRequest: payload => createAction(types.REMOVE_ACTIVE_REQUEST, payload),
};
