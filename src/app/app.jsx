import React, {
  Fragment,
  useEffect,
  useRef,
  useState,
} from 'react';
import { EVENT_TYPES, runSimulation } from 'd3-process';
import processData from './data.json';
import './app.scss';
import {
  IconAlpha,
  IconArchitecture,
  IconBackup,
  IconBeta,
  IconBugs,
  IconComponentImplementation,
  IconDeployment,
  IconDevOps,
  IconDownServer,
  IconFeedback,
  IconFinal,
  IconLogs,
  IconMonitoring,
  IconPlatform,
  IconPushFixes,
  IconResearch,
  IconRisk,
  IconScope,
  IconSpeed,
  IconStrategy,
  IconTasks,
  IconTechnical,
  IconTesting,
  IconUiux,
} from './icons';

const icons = {
  alpha: IconAlpha,
  architecture: IconArchitecture,
  backup: IconBackup,
  beta: IconBeta,
  bugs: IconBugs,
  componentImplementation: IconComponentImplementation,
  deployment: IconDeployment,
  devOps: IconDevOps,
  downServer: IconDownServer,
  feedback: IconFeedback,
  final: IconFinal,
  logs: IconLogs,
  monitoring: IconMonitoring,
  platform: IconPlatform,
  pushFixes: IconPushFixes,
  research: IconResearch,
  risk: IconRisk,
  scope: IconScope,
  speed: IconSpeed,
  strategy: IconStrategy,
  technical: IconTechnical,
  tasks: IconTasks,
  testing: IconTesting,
  uiux: IconUiux,
};

const App = () => {
  const canvasRef = useRef();
  const [size, setSize] = useState({ height: 0, width: 0 });
  const [simulation, setSimulation] = useState(null);
  const [selectedRootNode, setSelectedRootNode] = useState(null);

  useEffect(() => {
    const onWindowsResize = () => {
      const { height, width } = canvasRef.current.parentElement.getBoundingClientRect();

      setSize({
        height,
        width,
      });
    };
    const onSelectedRootNodeChange = (node) => {
      setSelectedRootNode(node);
    };
    let startedSimulation = null;

    if (canvasRef.current && !simulation) {
      startedSimulation = runSimulation(canvasRef.current, processData, {
        breakpointHeight: 500,
        breakpointWidth: 500,
        icons,
        simulationMaxHeight: 800,
      });

      setSelectedRootNode(startedSimulation.getSelectedRootNode());
      setSimulation(startedSimulation);

      setSize(canvasRef.current.parentElement.getBoundingClientRect());
    }

    const runningSimulation = startedSimulation || simulation;

    if (runningSimulation) {
      runningSimulation.addListener(EVENT_TYPES.SELECTED_ROOT_NODE_CHANGE, onSelectedRootNodeChange);
    }

    window.addEventListener('resize', onWindowsResize);

    return () => {
      if (runningSimulation) {
        runningSimulation.removeListener(EVENT_TYPES.SELECTED_ROOT_NODE_CHANGE, onSelectedRootNodeChange);
      }

      window.removeEventListener('resize', onWindowsResize);
    };
  }, [canvasRef.current, simulation]);

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
      <div className="canvas-parent">
        <canvas
          height={size.height}
          width={size.width}
          ref={canvasRef}
        />
      </div>
      {selectedRootNodeIndex === null ? null : (
        <Fragment>
          <div className="selected-title">{selectedRootNode.id}</div>
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
        </Fragment>
      )}
    </Fragment>
  );
};

export default App;
