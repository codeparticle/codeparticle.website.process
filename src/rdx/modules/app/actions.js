import types from 'rdx/modules/app/types';
import createAction from 'rdx/utils/createAction';

export default {
  batchActions: actions => createAction(types.BATCH_ACTIONS, actions),
};
