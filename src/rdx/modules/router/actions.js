import { push } from 'connected-react-router';
// import types from 'rdx/modules/router/types';
// import createAction from 'rdx/utils/createAction';

import queryString from 'lib/modules/query-string';

export default {
  navigate: (_url, params = {}) => {
    let url = _url;
    const query = queryString.stringify(params);
    if (query) url += `?${query}`;
    return push(url);
  },
};
