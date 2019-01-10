### React Web Template ###

### Run
From root:

- Make sure you're on nodejs v8.11.3 or v8.11.4 (use `nvm use v8.11.[x]`)
- `yarn install`
- `npm run start`

### Docker
Change `react-starter-app` to a more appropriate app name

Basic launch into background:
`docker-compose up -d`
Overridable parameters:
$ `ENV=prod PORT=3000 TAG=$(git rev-parse --short HEAD) docker-compose up -d`

Shut down:
$ `docker-compose down`

Force image rebuild and launch (add --build):
$ `docker-compose up -d --build`

### Generators
Creating new files from the command line should be quick and easy to skip over the tedium, encourage finer-grained modularization, and preserve consistency. The logic behind this is located in `internals/generators` and implemented with [plop](https://github.com/amwmedia/plop).

`npm i -g plop`

`npm run generate`

Things you can do:
- Create components / containers
- Create new redux modules (ducks)
    * this will not only generate the new module code, but import actions, reducers, and selectors into our app-wide pool
    * there is also an option to do the same for sagas

### Redux Design
- The redux organization principle is based on [ducks](https://github.com/erikras/ducks-modular-redux), which groups based on category. Conceptually, this regards the store as a data space decoupled from the views connected to it.
- Helpers residing in `src/rdx/utils/props-mapping.js` are used to make actions/data props mapping easy for redux connected components. Keys for selectors and actions can be easily updated.
    * This should help keep imports clean, reduce barrier to adjusting redux connection, and make it easier to divorce a component from redux altogether
    * this also enforces / makes easy the use of selectors, keeping that logic out of views and easy to refactor as data changes


### Styling
- All components are wrapped with a class suffixed `-rct-component`, which guards against collision
- For passing down styles, if they don't make sense residing in the child component, components can take in props.className with a class whose styles are specified in the parent's style file

### Async Redux

- wrapping saga logic with activeRequest adding and removal is available for request action tracking
- if request actions have an `id` parameter, views will be able to track particular instances that they fire off (see `activeRequestExists` in `rdx/modules/activeRequests/selectors`)

### Routing
- navigation is tethered to redux, through which one can access state, currentQuery params, and fire actions

### Environmental Variables
from root: `cp .env.example .env`
Any env vars prefixed with `REACT_APP_` will be accessible via `process.env`

### Conventions
- suffixing react component classes with `-rct-component` to prevent collision
- render methods in React classes prefixed with `render` (e.g. `renderList()`)
- prefix container specific rdx modules with camelCased container name (e.g. `loginModalError`)

### Misc
- We aren't using anything like Immutable as of now, so be sure to not to mutate data in reducers!
- Webpack is set up to understand absolute paths (once the `NODE_PATH` environmental var is set), which may seem unnecessary sometimes but makes it easy to move things around if needed

.env File is used for acrobat or adobe containing information for a dictionary
(https://fileinfo.com/extension/env)
- `cp .env.example .env`

### Tools
- [classnames](https://github.com/JedWatson/classnames)
- [redux-saga](https://github.com/JedWatson/classnames)
- [jest](http://jestjs.io/docs/en/api.html)
- [SASS](http://sass-lang.com/documentation/file.SASS_REFERENCE.html)
- [redux-persist](https://github.com/rt2zz/redux-persist)
- [connected-react-router](https://github.com/supasate/connected-react-router)
- [redux-dev-tools](https://github.com/zalmoxisus/redux-devtools-extension)

---------

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).
