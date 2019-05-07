import { forceSimulation, forceLink } from 'd3-force';

import {
  BORDER_DISTANCE,
  DOTTED_BORDER_THICKNESS,
  FONT_SIZES,
  LINK_BASE_COLOR,
  SCROLL_LERPING_SMOOTH,
  SOLID_BORDER_THICKNESS,
  SIZES,
  TEXT_FONT_FAMILY,
  TEXT_PADDING,
  TICKS_PER_STAGE,
  X_AXIS_PADDING,
} from './constants';
import {
  normalizeDisplacement,
  parseTreeData,
} from './utils';

let canvasWheelListener = null;
let windowResizeListener = null;
let windowScrollListener = null;

/**
 * Main function of the application. Call this to start the canvas animation.
 * @param {HTMLElement} canvas - Canvas to play the animation on
 * @param {Object} data - Data object to parse and generate nodes from
 * @param {Object} options - {
 *  @param {boolean} disableCanvasScrolling - When true, the canvas will not have a scroll event that intercepts the browsers' scroll
 *  @param {string} fontFamily - Font family of the text on top of the nodes
 *  @param {number} fontSize - Font size of the text on top of the nodes
 *  @param {string} linkLineColor - Color of the dotted line connecting the nodes
 *  @param {array} nodeSizes - Array of 3 elements for each node size
 *  @param {number} scrollSensitivity - Multiplier for the speed of the canvas scrolling
 *  @param {number} speedModifier - Multiplier for the speed of the animation
 * }
 * @returns {Object} simulation - returns the simulation object from d3-force library which has some useful util functions
 */
const runSimulation = (canvas, data, options = {}) => {
  const {
    disableCanvasScrolling = false,
    fontFamily = TEXT_FONT_FAMILY,
    fontSizes = FONT_SIZES,
    linkLineColor = LINK_BASE_COLOR,
    nodeSizes = SIZES,
    scrollSensitivity = 1,
    speedModifier = 1,
  } = options;
  const ticksPerStage = Math.ceil(speedModifier * TICKS_PER_STAGE);
  const context = canvas.getContext('2d');
  const { height, width } = canvas;
  const { links, nodes } = parseTreeData(data, canvas, { nodeSizes });
  let canvasBoundingBox = canvas.getBoundingClientRect();
  let nodesAnimating = [];
  let rootNodesToAnimateFromNextStage = [];
  let linksAnimating = [];
  let offsetX = 0;
  let targetOffsetX = 0;
  let rightMostNodeX = 0;
  const getLerpingValue = stageTicksLeft => Math.min((ticksPerStage - stageTicksLeft) / ticksPerStage, 1);

  (nodes || []).forEach((node) => {
    rightMostNodeX = Math.max(rightMostNodeX, node.fx + node.radius);
  });

  // Returns true if the root node has been visible on the screen at least once
  const canNodeBeDrawn = (node) => {
    const { root } = node;
    const { left } = canvasBoundingBox;

    if (node.rootNode || (node.root && node.root.hasBeenVisible)) {
      return true;
    }

    if (root) {
      const leftMostX = left + root.x + offsetX;

      if (root.animationFinished && leftMostX >= 0 && leftMostX <= window.innerWidth) {
        root.hasBeenVisible = true;

        return true;
      }
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

  const stageNodesByRoot = { sortedRoots: [] };
  const stageLinksByType = { normal: [], root: [] };
  let stageTicksLeft = ticksPerStage;

  const pushStageNode = (node) => {
    const rootNode = node.root || node;
    const stageNodesForRoot = stageNodesByRoot[rootNode.id];

    if (stageNodesForRoot) {
      stageNodesForRoot.push(node);
    } else {
      stageNodesByRoot[rootNode.id] = [rootNode];
      stageNodesByRoot.sortedRoots.push(rootNode);
      stageNodesByRoot.sortedRoots.sort((node1, node2) => node2.siblingIndex - node1.siblingIndex);
    }
  };

  const pushStageLink = (link) => {
    if (link.source.rootNode && link.target.rootNode) {
      stageLinksByType.root.push(link);
    } else {
      stageLinksByType.normal.push(link);
    }
  };

  const reSortStageNodes = () => {
    stageNodesByRoot.sortedRoots.forEach((rootNode) => {
      const allNodesByRoot = stageNodesByRoot[rootNode.id];

      allNodesByRoot.sort((node1, node2) => {
        if (node1.rootNode) {
          return -1;
        }

        if (node2.rootNode) {
          return 1;
        }

        return node1.level - node2.level;
      });
    });
  };

  nodesAnimating.forEach(pushStageNode);

  const checkForNewNodes = () => {
    rootNodesToAnimateFromNextStage = [];

    nodes.forEach((node) => {
      if (node.rootNode && !node.hasBeenVisible && node.animationFinished) {
        rootNodesToAnimateFromNextStage.push(node);
      }
    });
  };

  // Draws a line between twp nodes
  const drawLink = (d, lerp = 1) => {
    let { x, y } = d.target;
    const distanceVector = {
      x: x - d.source.x,
      y: y - d.source.y,
    };
    const distance = Math.sqrt((distanceVector.x ** 2) + (distanceVector.y ** 2));

    if (distance < d.source.currentRadius + d.target.currentRadius) {
      return;
    }

    normalizeDisplacement(distanceVector, 1, '');

    if (lerp !== 1) {
      const lerpedDistance = distance * lerp;

      x = d.source.x + (distanceVector.x * lerpedDistance);
      y = d.source.y + (distanceVector.y * lerpedDistance);
    }

    const borderDisplacement = {
      x: distanceVector.x * (BORDER_DISTANCE + DOTTED_BORDER_THICKNESS),
      y: distanceVector.y * (BORDER_DISTANCE + DOTTED_BORDER_THICKNESS),
    };
    const sourceDisplacement = {
      x: d.source.currentRadius * distanceVector.x,
      y: d.source.currentRadius * distanceVector.y,
    };
    const targetDisplacement = {
      x: d.target.currentRadius * distanceVector.x,
      y: d.target.currentRadius * distanceVector.y,
    };

    context.moveTo(
      offsetX + d.source.x + sourceDisplacement.x + borderDisplacement.x,
      d.source.y + sourceDisplacement.y + borderDisplacement.y,
    );
    context.lineTo(
      offsetX + x - targetDisplacement.x - borderDisplacement.x,
      y - targetDisplacement.y - borderDisplacement.y,
    );
  };

  // Draws a node (circle)
  const drawNode = (d, extraRadius = 0) => {
    let { currentRadius } = d;

    if (nodesAnimating.includes(d)) {
      currentRadius += extraRadius * getLerpingValue(stageTicksLeft);
    } else {
      currentRadius += extraRadius;
    }

    context.moveTo(offsetX + d.x + currentRadius, d.y);
    context.arc(offsetX + d.x, d.y, currentRadius, 0, 2 * Math.PI, false);
  };

  // Draws text inside a node
  const drawText = (d) => {
    const fontSize = fontSizes[d.size];
    const maxWidth = (d.radius * 2) - TEXT_PADDING;
    const words = d.id.split(' ');
    const allLines = [];
    let currentWord = words[0];
    let i = 0;

    while (i <= words.length - 1) {
      if (i < words.length - 1) {
        const possibleSentence = `${currentWord} ${words[i + 1]}`;

        if (context.measureText(possibleSentence).width <= maxWidth - TEXT_PADDING) {
          currentWord = possibleSentence;
        } else {
          allLines.push(currentWord);
          currentWord = words[i + 1];
        }
      } else if (currentWord) {
        allLines.push(currentWord);
      }

      i += 1;
    }

    const drawTextWithOffset = (text, offset) => {
      context.fillText(text, offsetX + d.x, d.y + offset);
    };
    const totalHeight = allLines.length * fontSize;
    const halfHeight = totalHeight / 4;

    allLines.forEach((line, index) => {
      const offset = (index / allLines.length) * totalHeight;

      drawTextWithOffset(line, allLines.length > 1 ? offset - halfHeight : 0);
    });
  };

  const onProcessTick = () => {
    const offsetXChange = (targetOffsetX - offsetX) * SCROLL_LERPING_SMOOTH;

    if (offsetXChange > 2) {
      offsetX += offsetXChange;
    } else {
      offsetX = targetOffsetX;
      checkForNewNodes();
    }

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

    stageNodesByRoot.sortedRoots.forEach((rootNode) => {
      const nodesToDraw = stageNodesByRoot[rootNode.id];

      nodesToDraw.forEach((node) => {
        let radius = nodeSizes[node.size];

        if (nodesAnimating.includes(node)) {
          const ticksRatio = getLerpingValue(stageTicksLeft);

          radius *= ticksRatio;
        }

        node.currentRadius = radius;
      });
    });

    // Draw all the regular dashed lines
    context.beginPath();
    stageLinksByType.normal.forEach(d => drawLink(d));
    linksAnimating.forEach(d => drawLink(d, getLerpingValue(stageTicksLeft)));
    // Fix the bug where canvas stretches or doesn't draw the last line properly
    context.moveTo(0, 0);
    context.lineTo(0, 0);
    context.setLineDash([4, 3]);
    context.strokeStyle = linkLineColor;
    context.lineWidth = 2;
    context.closePath();
    context.stroke();

    // Draw all the solid lines connecting the roots
    context.setLineDash([]);
    context.lineWidth = 6;
    stageLinksByType.root.forEach((link) => {
      context.beginPath();

      const gradient = context.createLinearGradient(link.source.x, link.source.y, link.target.x, link.target.y);
      gradient.addColorStop(0, link.source.color);
      gradient.addColorStop(1, link.target.color);
      context.strokeStyle = gradient;

      drawLink(link);
      context.closePath();
      context.stroke();
    });

    // Draw all borders
    stageNodesByRoot.sortedRoots.forEach((rootNode) => {
      const nodesToDraw = stageNodesByRoot[rootNode.id];

      // Dotted borders
      context.strokeStyle = linkLineColor;
      context.lineWidth = DOTTED_BORDER_THICKNESS;
      context.setLineDash([4, 3]);
      context.beginPath();
      nodesToDraw.forEach(d => !d.rootNode && drawNode(d, BORDER_DISTANCE));
      context.closePath();
      context.stroke();

      // Solid borders
      context.strokeStyle = rootNode.color;
      context.lineWidth = SOLID_BORDER_THICKNESS;
      context.setLineDash([]);
      context.beginPath();
      drawNode(rootNode, BORDER_DISTANCE);
      context.closePath();
      context.stroke();

      // Draw nodes
      context.fillStyle = rootNode.color ? rootNode.color : '#000';
      context.beginPath();
      nodesToDraw.forEach(d => drawNode(d));
      context.closePath();
      context.fill();

      // Draw node titles
      context.fillStyle = '#FFF';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      nodesToDraw.forEach((node) => {
        if (node.animationFinished) {
          const fontSize = fontSizes[node.size];

          context.font = `normal normal 500 ${fontSize}px ${fontFamily}`;
          drawText(node);
        }
      });
    });
  };

  // Called when an animation step has been finished
  const onStageFinished = () => {
    const previousNodesAnimating = nodesAnimating.concat(...rootNodesToAnimateFromNextStage);
    const newLinks = [];

    canvasBoundingBox = canvas.getBoundingClientRect();

    linksAnimating.forEach(pushStageLink);
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
      pushStageNode(node);
    });

    reSortStageNodes();

    newLinks.forEach(pushStageLink);

    onProcessTick();
  };

  const simulation = forceSimulation(nodes).force('link', forceLink(links).id(d => d.id).strength(0)).on('tick', () => {
    onProcessTick();
    onDrawTick();

    if (nodesAnimating.length || linksAnimating.length) {
      if (stageTicksLeft <= 0) {
        stageTicksLeft = ticksPerStage;

        onStageFinished();
      }

      stageTicksLeft -= 1;
    }
  });

  const reheatSimulation = () => {
    simulation.alpha(1);
    simulation.restart();
  };

  // Checks for newly visible root nodes that haven't been animated
  const onWindowResizeOrScroll = () => {
    checkForNewNodes();

    if (!nodesAnimating.length && !linksAnimating.length) {
      onStageFinished();
    }

    reheatSimulation();
  };

  if (windowResizeListener) {
    window.removeEventListener('resize', windowResizeListener);
  }

  if (windowScrollListener) {
    window.removeEventListener('scroll', windowScrollListener, true);
  }

  if (canvasWheelListener) {
    canvas.removeEventListener('wheel', canvasWheelListener, false);
  }

  window.addEventListener('resize', function _onWindowResize() {
    windowResizeListener = _onWindowResize;
    onWindowResizeOrScroll();
  });

  window.addEventListener('scroll', function _onWindowScroll() {
    windowScrollListener = _onWindowScroll;
    onWindowResizeOrScroll();
  }, true);

  if (!disableCanvasScrolling) {
    canvas.addEventListener('wheel', function _onCanvasWheel(event) {
      event.preventDefault();
      canvasWheelListener = _onCanvasWheel;

      const maxX = rightMostNodeX - window.innerWidth + X_AXIS_PADDING;

      targetOffsetX = Math.max(Math.min(targetOffsetX - (event.deltaX * 0.5 * scrollSensitivity), 0), -maxX);
      reheatSimulation();

      return false;
    }, false);
  }

  return simulation;
};

export { runSimulation };
