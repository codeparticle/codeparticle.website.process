import React from 'react';
import renderer from 'react-test-renderer';

import App from './app';

it('renders correctly when there are no items', () => {
  const tree = renderer.create(<App />).toJSON();
  expect(tree).toMatchInlineSnapshot(`
<div
  className="canvas-parent"
>
  <canvas
    height={0}
    width={0}
  />
</div>
`);
});
