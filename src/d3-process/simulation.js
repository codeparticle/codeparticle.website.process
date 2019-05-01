import { forceSimulation, forceLink } from 'd3-force';

import {
  SIZES,
  TICKS_PER_STAGE,
} from './constants';
import {
  normalizeDisplacement,
  parseTreeData,
} from './utils';

const getLerpingValue = stageTicksLeft => (TICKS_PER_STAGE - stageTicksLeft) / TICKS_PER_STAGE;
let windowResizeListener = null;
let windowScrollListener = null;

const runSimulation = (canvas, data) => {
  const context = canvas.getContext('2d');
  const { height, width } = canvas;
  const { links, nodes } = parseTreeData(data, canvas);
  let canvasBoundingBox = canvas.getBoundingClientRect();
  let nodesAnimating = [];
  let rootNodesToAnimateFromNextStage = [];
  let linksAnimating = [];

  // Returns true if the root node has been visible on the screen at least once
  const canNodeBeDrawn = (node) => {
    const { root } = node;
    const { left } = canvasBoundingBox;

    if (node.rootNode || (node.root && node.root.hasBeenVisible)) {
      return true;
    }

    if (root && root.animationFinished && left + root.x >= 0 && left + root.x <= window.innerWidth) {
      root.hasBeenVisible = true;

      return true;
    }

    return false;
  };

  if (nodes && nodes.length) {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];

      if (node.rootNode && canNodeBeDrawn(node)) {
        nodesAnimating.push(node);

        break;
      }
    }
  }

  const stageNodes = nodesAnimating.slice();
  const stageLinks = [];
  let stageTicksLeft = TICKS_PER_STAGE;

  // Draws a line between twp nodes
  const drawLink = (d, lerp = 1) => {
    context.moveTo(d.source.x, d.source.y);

    let { x, y } = d.target;

    if (lerp !== 1) {
      const distanceVector = {
        x: x - d.source.x,
        y: y - d.source.y,
      };
      const distance = Math.sqrt((distanceVector.x ** 2) + (distanceVector.y ** 2));

      normalizeDisplacement(distanceVector, distance * lerp, '');
      x = d.source.x + distanceVector.x;
      y = d.source.y + distanceVector.y;
    }

    context.lineTo(x, y);
  };

  // Draws a node (circle)
  const drawNode = (d) => {
    let radius = SIZES[d.size];

    if (nodesAnimating.includes(d)) {
      const ticksRatio = getLerpingValue(stageTicksLeft);

      radius *= ticksRatio;
    }

    context.moveTo(d.x + 3, d.y);
    context.arc(d.x, d.y, radius, 0, 2 * Math.PI, false);
  };

  const onProcessTick = () => {
    nodesAnimating.forEach((node) => {
      const ticksRatio = getLerpingValue(stageTicksLeft);

      if (node.parent) {
        node.x = node.parent.x + ((node.targetX - node.parent.x) * ticksRatio);
        node.y = node.parent.y + ((node.targetY - node.parent.y) * ticksRatio);
      }
    });
  };

  // Called every frame of the simulation to draw the nodes and links between them
  const onDrawTick = () => {
    context.clearRect(0, 0, width, height);

    context.beginPath();
    stageLinks.forEach(d => drawLink(d));
    linksAnimating.forEach(d => drawLink(d, getLerpingValue(stageTicksLeft)));
    context.strokeStyle = '#aaa';
    context.stroke();

    context.beginPath();
    stageNodes.forEach(drawNode);
    context.fill();
  };

  // Called when an animation step has been finished
  const onStageFinished = () => {
    const previousNodesAnimating = nodesAnimating.concat(...rootNodesToAnimateFromNextStage);
    const newLinks = [];

    canvasBoundingBox = canvas.getBoundingClientRect();
    stageLinks.push(...linksAnimating);
    nodesAnimating = [];
    linksAnimating = [];
    rootNodesToAnimateFromNextStage = [];

    const animateNode = (...nodesToAnimate) => {
      nodesToAnimate.forEach((node) => {
        if (!node.animating && !node.animationFinished && canNodeBeDrawn(node)) {
          nodesAnimating.push(node);
        }
      });
    };

    previousNodesAnimating.forEach((node) => {
      node.animating = false;
      node.animationFinished = true;

      if (node.rootNode) {
        if (node.next) {
          animateNode(node.next);
        }

        if (node.last && !node.last.animationFinished && !node.last.animating) {
          animateNode(node.last);
        }
      }

      if (node.children) {
        animateNode(...node.children);
      }

      if (node.parent && !node.parent.animationFinished && !node.parent.animating) {
        animateNode(node.parent);
      }

      if (node.links) {
        node.links.forEach((link) => {
          if (!link.external && (nodesAnimating.includes(link.target) || nodesAnimating.includes(link.source))) {
            newLinks.push(link);
          } else if (link.source.animationFinished && link.target.animationFinished) {
            linksAnimating.push(link);
          }
        });
      }
    });

    nodesAnimating.forEach((node) => {
      node.animating = true;
      node.targetX = node.fx;
      node.targetY = node.fy;
      node.fx = null;
      node.fy = null;
      node.x = node.parent.x;
      node.y = node.parent.y;
    });

    stageNodes.push(...nodesAnimating);
    stageLinks.push(...newLinks);

    onProcessTick();
  };

  const simulation = forceSimulation(nodes).force('link', forceLink(links).id(d => d.id).strength(0)).on('tick', () => {
    onProcessTick();
    onDrawTick();

    if (nodesAnimating.length || linksAnimating.length) {
      stageTicksLeft -= 1;

      if (stageTicksLeft <= 0) {
        stageTicksLeft = TICKS_PER_STAGE;

        onStageFinished();
      }
    }
  });

  // Checks for newly visible root nodes that haven't been animated
  const checkForNewNodes = () => {
    rootNodesToAnimateFromNextStage = [];

    nodes.forEach((node) => {
      if (node.rootNode && !node.hasBeenVisible && node.animationFinished) {
        rootNodesToAnimateFromNextStage.push(node);
      }
    });

    if (!nodesAnimating.length && !linksAnimating.length) {
      onStageFinished();
    }

    simulation.alpha(1);
    simulation.restart();
  };

  if (windowResizeListener) {
    window.removeEventListener('resize', windowResizeListener);
    window.removeEventListener('scroll', windowScrollListener, true);
  }

  window.addEventListener('resize', function _onWindowResize() {
    windowResizeListener = _onWindowResize;
    checkForNewNodes();
  });

  window.addEventListener('scroll', function _onWindowScroll() {
    windowScrollListener = _onWindowScroll;
    checkForNewNodes();
  }, true);

  return simulation;
};

export { runSimulation };
