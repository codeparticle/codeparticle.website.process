### codeparticle.website.process ###

### Install

- `yarn add codeparticle.website.process`

### Usage

Call the method `runSimulation` with a canvas reference and the data you would like to be rendered. Make sure the canvas has height and width attributes assigned to it. Also, `runSimulation` should not be called repeatedly. It should be called only once.
If there is any issues with the browser crashing or being stuck in an infinite loop, it is most likely because the data is too much and the height of the canvas is too small.

```
import React, { useEffect, useRef, useState } from 'react';
import { runSimulation } from 'codeparticle.website.process';

const Component = (props) => {
  const canvasRef = useRef();
  const [simulation, setSimulation] = useState();

  useEffect(() => {
    if (canvasRef.current && !simulation) {
      setSimulation(runSimulation(canvasRef.current, data));
    }
  }, [simulation]);

  return (
    <canvas
      ref={canvasRef}
      height='700px'
      width='800px'>
  );
};
```

Methods Available on the Simulation Object:
* getSelectedRootNode - Gets the currently selected root node (Left-most root node visible on the screen)
* setSelectedRootNode - Sets the currently selected root node and scrolls to it
* resetScrolling - Resets the scrolling to the minimum position
* addListener - Adds an event listeners
* removeListener - Removes an event listener

EVENT_TYPES:
* scroll - Called when the canvas is scrolled if `disableCanvasScrolling` option was not set to true
* selectedRootNodeChange - Called when the select root node (left-most root node) changes

### Run Demo

- Clone https://github.com/codeparticle/codeparticle.website.process
- Make sure you're on nodejs v8.11.3 or v8.11.4 (use `nvm use v8.11.[x]`)
- `yarn install`
- `yarn run dev`

---------

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).
