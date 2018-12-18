import createReducer from 'rdx/utils/createReducer';
import types from 'rdx/modules/activeRequests/types';

export default {
  activeRequests: createReducer([], {
    [types.ADD_ACTIVE_REQUEST](state, action) {
      const index = state.findIndex(ar => ar.id === action.payload.id);
      // do nothing if AR already in state
      if (index >= 0) return state;
      return state.concat(action.payload);
    },
    [types.REMOVE_ACTIVE_REQUEST](state, action) {
      const index = state.findIndex(ar => ar.id === action.payload.id);
      // do nothing if AR not in state
      if (index < 0) return state;
      const newState = [...state];
      newState.splice(index, 1);
      return newState;
    },
  }),
};
