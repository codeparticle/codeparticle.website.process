import types from 'rdx/modules/messages/types';
import createAction from 'rdx/utils/createAction';

export default {
  newErrorEvent: payload => createAction(types.NEW_ERROR_EVENT, payload),
  newMessageEvent: payload => createAction(types.NEW_MESSAGE_EVENT, payload),
};
