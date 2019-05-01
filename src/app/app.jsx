import React, { useEffect, useRef } from 'react';
import { runSimulation } from 'd3-process';
import processData from './data.json';
import './app.scss';

const App = () => {
  const canvasRef = useRef();

  useEffect(() => {
    if (canvasRef.current) {
      runSimulation(canvasRef.current, processData);
    }
  }, [canvasRef.current]);

  return (
    <canvas
      height={600}
      width={2000}
      ref={canvasRef}
    />
  );
};

export default App;
