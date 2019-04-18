import { forceSimulation, forceLink } from 'd3-force';

import {
  ROOT_NODES_DISTANCE,
  SIZES,
  INITIAL_X,
  TICKS_PER_STAGE,
  DISTANCE_TICK_BASE_DIVISOR,
} from './constants';
import { normalizeDisplacement, parseTreeData } from './utils';

const getTransitionStage = (canvas, transitionStages, stage) => {
  if (stage === 0) {
    const node = transitionStages[0].nodes[0];

    node.x = INITIAL_X;
    node.y = canvas.height / 2;

    return {
      nodes: transitionStages[0].nodes,
      links: [],
    };
  }

  const transitionStage = transitionStages[stage];

  if (!transitionStage) {
    return null;
  }

  transitionStage.nodes.forEach((node) => {
    if (node.rootNode) {
      node.distanceToTravel = ROOT_NODES_DISTANCE;
    } else {
      node.distanceToTravel = (SIZES[node.parent.size] * 1.5) + SIZES[node.size];
    }

    node.x = node.parent.x;
    node.y = node.parent.y;
    node.dx = 0;
    node.dy = 0;

    if (node.rootNode) {
      node.dx = 1;
    } else if (node.level === 1) {
      node.dy = -1;
    } else {
      node.dx = 1;
      node.dy = -1;
    }

    normalizeDisplacement(node);
  });

  return transitionStage;
};

const runSimulation = (canvas, data) => {
  const context = canvas.getContext('2d');
  const { height, width } = canvas;
  const { links, nodes, transitionStages } = parseTreeData(data);

  const firstTransitionStage = getTransitionStage(canvas, transitionStages, 0);
  const stageNodes = firstTransitionStage.nodes.slice();
  const stageLinks = firstTransitionStage.links.slice();
  let currentStage = 0;
  let stageTicksLeft = TICKS_PER_STAGE;
  let nodesForCurrentStage = [];

  const drawLink = (d) => {
    context.moveTo(d.source.x, d.source.y);
    context.lineTo(d.target.x, d.target.y);
  };

  const drawNode = (d) => {
    let radius = SIZES[d.size];

    if (currentStage === 0) {
      const ticksRatio = (TICKS_PER_STAGE - stageTicksLeft) / TICKS_PER_STAGE;

      radius *= ticksRatio;
    }

    context.moveTo(d.x + 3, d.y);
    context.arc(d.x, d.y, radius, 0, 2 * Math.PI, false);
  };

  const onProcessTick = () => {
    nodesForCurrentStage.forEach((node) => {
      const pixelsPerTick = node.distanceToTravel / DISTANCE_TICK_BASE_DIVISOR;

      node.vx = node.dx * pixelsPerTick;
      node.vy = node.dy * pixelsPerTick;
    });
  };

  const onDrawTick = () => {
    context.clearRect(0, 0, width, height);

    context.beginPath();
    stageLinks.forEach(drawLink);
    context.strokeStyle = '#aaa';
    context.stroke();

    context.beginPath();
    stageNodes.forEach(drawNode);
    context.fill();
  };

  const onStageFinished = () => {
    const transitionStage = getTransitionStage(canvas, transitionStages, currentStage);

    nodesForCurrentStage.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
    });

    if (transitionStage) {
      nodesForCurrentStage = transitionStage.nodes;

      stageNodes.push(...transitionStage.nodes);
      stageLinks.push(...transitionStage.links);
    } else {
      nodesForCurrentStage = [];
    }

    onProcessTick();
  };

  return forceSimulation(nodes).force('link', forceLink(links).id(d => d.id).strength(0)).on('tick', () => {
    onProcessTick();
    onDrawTick();

    if (currentStage < transitionStages.length) {
      stageTicksLeft -= 1;

      if (stageTicksLeft <= 0) {
        currentStage += 1;
        stageTicksLeft = TICKS_PER_STAGE;

        onStageFinished();
      }
    }
  });
};

export { runSimulation };
