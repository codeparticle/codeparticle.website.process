import React, {
  Fragment,
  useEffect,
  useRef,
  useState,
} from 'react';
import { EVENT_TYPES, runSimulation } from 'd3-process';
import processData from './data.json';
import './app.scss';

const App = () => {
  const canvasRef = useRef();
  const [simulation, setSimulation] = useState(null);
  const [selectedRootNode, setSelectedRootNode] = useState(null);

  useEffect(() => {
    const onSelectedRootNodeChange = (node) => {
      setSelectedRootNode(node);
    };
    let startedSimulation = null;

    if (canvasRef.current) {
      startedSimulation = runSimulation(canvasRef.current, processData);

      startedSimulation.addListener(EVENT_TYPES.SELECTED_ROOT_NODE_CHANGE, onSelectedRootNodeChange);
      setSelectedRootNode(startedSimulation.getSelectedRootNode());
      setSimulation(startedSimulation);
    }

    return () => {
      if (startedSimulation) {
        startedSimulation.removeListener(EVENT_TYPES.SELECTED_ROOT_NODE_CHANGE, onSelectedRootNodeChange);
      }
    };
  }, [canvasRef.current]);

  let selectedRootNodeIndex = null;

  if (selectedRootNode !== null) {
    selectedRootNodeIndex = selectedRootNode.siblingIndex;
  }

  const onBackClick = () => {
    if (selectedRootNode.last) {
      simulation.setSelectedRootNode(selectedRootNode.last.id);
    }
  };
  const onForwardClick = () => {
    if (selectedRootNode.next) {
      simulation.setSelectedRootNode(selectedRootNode.next.id);
    }
  };

  return (
    <Fragment>
      <canvas
        height={700}
        width={2800}
        ref={canvasRef}
      />
      {selectedRootNodeIndex === null ? null : (
        <div className="buttons">
          <button
            disabled={selectedRootNodeIndex === 0}
            onClick={onBackClick}
          >
            Focus previous
          </button>
          <button
            disabled={selectedRootNodeIndex === processData.rootNodes.length - 1}
            onClick={onForwardClick}
          >
            Focus next
          </button>
        </div>
      )}
    </Fragment>
  );
};

export default App;
