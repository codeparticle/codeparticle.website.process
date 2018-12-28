import createReducer from 'rdx/utils/create-reducer';
import types from 'rdx/modules/auth/types';

export default {
  authToken: createReducer('', {
    [types.SET_AUTH_TOKEN](state, action) {
      return action.payload;
    },
  }),
};
