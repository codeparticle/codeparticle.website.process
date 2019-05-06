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
      height={700}
      width={2800}
      ref={canvasRef}
    />
  );
};

export default App;
