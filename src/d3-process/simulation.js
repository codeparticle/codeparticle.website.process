import { forceSimulation, forceLink } from 'd3-force';

import {
  AXIS_PADDING,
  BORDER_DISTANCE,
  DEFAULT_FONT_SIZES,
  DEFAULT_LINK_BASE_COLOR,
  DEFAULT_NODE_TITLE_BASE_COLOR,
  DEFAULT_SIMULATION_MAX_HEIGHT,
  DEFAULT_SIZES,
  DEFAULT_TEXT_FONT_FAMILY,
  DOTTED_BORDER_THICKNESS,
  EVENT_TYPES,
  NODE_BORDER_WIDTH,
  ROOT_NODE_LINK_LINE_WIDTH,
  ROOT_NODE_SELECTION_SCROLL_LERPING_SMOOTH,
  SCROLL_LERPING_SMOOTH,
  TEXT_PADDING,
  TICKS_PER_STAGE,
} from './constants';
import {
  getLeftMostChildX,
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
 *  @param {boolean} breakpointHeight - Height at which canvas is converted into a mobile layout (Canvas height, not window)
 *  @param {boolean} breakpointWidth - Width at which canvas is converted into a mobile layout (Canvas width, not window)
 *  @param {boolean} disableCanvasScrolling - When true, the canvas will not have a scroll event that intercepts the browsers' scroll
 *  @param {boolean} disableRootNodeSelectionOnScroll - When true, the root node selection does not change when the canvas is scrolled
 *  @param {boolean} expandOnlyOnSelected - When true, nodes will only expand when they are selected
 *  @param {string} fontFamily - Font family of the text on top of the nodes
 *  @param {string} focusSelectedRootNodeOnResize - When false, selected root nodes will not be automatically focused on window resize
 *  @param {number} fontSizes - Font sizes of the text on top of the nodes
 *  @param {Object} icons - Icons to be displayed on top of nodes (property names must match to the node.icon field)
 *  @param {string} linkLineColor - Color of the dotted line connecting the nodes
 *  @param {array} nodeSizes - Array of 3 elements for each node size
 *  @param {number} scrollSensitivity - Multiplier for the speed of the canvas scrolling
 *  @param {number} speedModifier - Multiplier for the speed of the animation
 * }
 * @returns {Object} simulation - returns the simulation object from d3-force library which has some useful util functions
 * The following extra functions are available within the simulation object:
 * getSelectedRootNode - gets the currently selected root node (Left-most root node visible on the screen)
 * setSelectedRootNode - sets the currently selected root node and scrolls to it
 * resetScrolling - resets the scrolling to the minimum position
 * addListener - adds an event listeners
 * removeListener - removes an event listener
 */
const runSimulation = (canvas, data, options = {}) => {
  const {
    breakpointHeight = null,
    breakpointWidth = null,
    disableCanvasScrolling = false,
    disableRootNodeSelectionOnScroll = false,
    expandOnlyOnSelected = false,
    focusSelectedRootNodeOnResize = true,
    fontFamily = DEFAULT_TEXT_FONT_FAMILY,
    fontSizes = DEFAULT_FONT_SIZES,
    icons = {},
    linkLineColor = DEFAULT_LINK_BASE_COLOR,
    nodeSizes = DEFAULT_SIZES,
    nodeTitleBaseColor = DEFAULT_NODE_TITLE_BASE_COLOR,
    scrollSensitivity = 1,
    speedModifier = 1,
    simulationMaxHeight = DEFAULT_SIMULATION_MAX_HEIGHT,
  } = options;
  const ticksPerStage = Math.ceil(speedModifier * TICKS_PER_STAGE);
  const context = canvas.getContext('2d');
  const { links, nodes } = parseTreeData(data, simulationMaxHeight, { icons, nodeSizes });
  const rootNodesRemaining = nodes.filter(node => node.rootNode);
  const rootNodes = [...rootNodesRemaining];
  const listeners = {
    [EVENT_TYPES.SCROLL]: [],
    [EVENT_TYPES.SELECTED_ROOT_NODE_CHANGE]: [],
  };
  let selectedRootNode = null;
  let canvasBoundingBox = canvas.getBoundingClientRect();
  let nodesAnimating = [];
  let rootNodesToAnimateFromNextStage = [];
  let linksAnimating = [];
  let initialXWhenSelectingRootNode = 0;
  let targetRootNodeToSelect = null;
  let offsetX = 0;
  let targetOffsetX = 0;
  let rightMostNode = 0;
  let bottomMostNode = null;
  let topMostNode = null;
  let scrolling = false;
  let scrollingStageFinishedTimeout = null;
  const getLerpingValue = stageTicksLeft => Math.min((ticksPerStage - stageTicksLeft) / ticksPerStage, 1);

  (nodes || []).forEach((node) => {
    if (!rightMostNode || rightMostNode.x < node.fx) {
      rightMostNode = node;
    }

    if (!bottomMostNode || bottomMostNode.y < node.fy) {
      bottomMostNode = node;
    }

    if (!topMostNode || topMostNode.y > node.fy) {
      topMostNode = node;
    }

    node.x = node.fx;
    node.y = node.fy;
    node.finalX = node.fx;
    node.finalY = node.fy;
    node.targetX = node.fx;
    node.targetY = node.fy;
    node.fx = null;
    node.fy = null;
  });

  const isMobile = () => (
    (breakpointHeight !== null && canvas.offsetHeight <= breakpointHeight)
    || ((breakpointWidth !== null && canvas.offsetWidth <= breakpointWidth))
  );
  const getZoom = () => Math.min(canvas.offsetHeight / simulationMaxHeight, 1);

  const getTargetNodeOffsetX = (node) => {
    const zoom = getZoom();
    const maxVisibleWidth = ((rightMostNode.finalX + rightMostNode.radius) * zoom) + AXIS_PADDING;
    const maxX = maxVisibleWidth - canvas.offsetWidth;

    return Math.min(Math.max(-(getLeftMostChildX(node) - AXIS_PADDING) * zoom, -maxX), 0);
  };

  const reCenterNodes = () => {
    (nodes || []).forEach((node) => {
      node.targetY = node.finalY + Math.max((canvas.height - simulationMaxHeight) / 2, 0);

      if (node.animationFinished || node.static) {
        node.y = node.targetY;
      }
    });
  };

  const setOffsets = (setToMin = false, {
    deltaX = 0,
  } = {}) => {
    const { left: parentLeft } = canvas.parentElement.getBoundingClientRect();
    const { left } = canvas.getBoundingClientRect();
    const sensitivity = scrollSensitivity / 2;
    const maxVisibleWidth = ((rightMostNode.finalX + rightMostNode.radius) * getZoom()) + AXIS_PADDING;
    let minX = left - parentLeft;
    let maxX = maxVisibleWidth - canvas.offsetWidth;

    if (left > parentLeft || maxVisibleWidth <= canvas.offsetWidth) {
      minX = 0;
      maxX = 0;
    }

    if (setToMin) {
      targetOffsetX = -minX;
      offsetX = targetOffsetX;
    } else {
      targetOffsetX = Math.max(Math.min(targetOffsetX - (deltaX * sensitivity), -minX), -maxX);
    }
  };

  // Returns true if the root node has been visible on the screen at least once
  const canNodeBeDrawn = (node) => {
    const { root } = node;
    const { left } = canvasBoundingBox;
    const zoom = getZoom();

    if (expandOnlyOnSelected) {
      return node.rootNode || root.hasBeenSelected;
    }

    if (node.rootNode || (node.root && node.root.hasBeenVisible)) {
      return true;
    }

    if (root) {
      const leftMostX = offsetX + ((left + root.x) * zoom);

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

      if (node.rootNode) {
        node.hasBeenSelected = true;
        node.static = true;
        nodesAnimating.push(node);
        selectedRootNode = node;

        break;
      }
    }
  }

  reCenterNodes();
  setTimeout(reCenterNodes);

  if (!disableCanvasScrolling) {
    setOffsets(true);
    setTimeout(() => setOffsets(true));
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
    const previousSelectedRootNode = selectedRootNode;
    let foundFirstRootNodeVisible = false;

    canvasBoundingBox = canvas.getBoundingClientRect();
    rootNodesToAnimateFromNextStage = [];

    rootNodes.forEach((node) => {
      if (node.rootNode) {
        if (!disableRootNodeSelectionOnScroll) {
          const nodeX = (node.finalX || node.targetX) * getZoom();
          const x = canvasBoundingBox.left + nodeX + offsetX;
          const nodeIsVisibleOnSelectionViewport = x >= canvasBoundingBox.left;

          if (!foundFirstRootNodeVisible && nodeIsVisibleOnSelectionViewport) {
            foundFirstRootNodeVisible = true;
            selectedRootNode = node;
          }
        }

        const distanceLeftToScroll = offsetX - targetOffsetX;
        const canAnimateIfExpandOnlyOnSelectedFalse = !expandOnlyOnSelected
          && !targetRootNodeToSelect && (!node.hasBeenVisible && node.animationFinished);
        const canAnimateIfExpandOnlyOnSelectedTrue = expandOnlyOnSelected && Math.abs(distanceLeftToScroll) <= 1 && node.hasBeenSelected;

        if (canAnimateIfExpandOnlyOnSelectedFalse || canAnimateIfExpandOnlyOnSelectedTrue) {
          rootNodesToAnimateFromNextStage.push(node);
        }
      }
    });

    const manuallySelectingRootNode = targetRootNodeToSelect && previousSelectedRootNode.id !== targetRootNodeToSelect.id;
    const scrollSelectingRootNode = !disableRootNodeSelectionOnScroll && !targetRootNodeToSelect && previousSelectedRootNode !== selectedRootNode;

    if (manuallySelectingRootNode || scrollSelectingRootNode) {
      listeners[EVENT_TYPES.SELECTED_ROOT_NODE_CHANGE].forEach((callback) => {
        callback(selectedRootNode);
      });
    }
  };

  // Draws a line between twp nodes
  const drawLink = (d, lerp, isMobileSize) => {
    const zoom = getZoom();
    let { x, y } = d.target;
    const distanceVector = {
      x: x - d.source.x,
      y: y - d.source.y,
    };
    const distance = Math.sqrt((distanceVector.x ** 2) + (distanceVector.y ** 2));
    const borderDistance = BORDER_DISTANCE + DOTTED_BORDER_THICKNESS;

    if (distance < d.source.currentRadius + d.target.currentRadius) {
      return null;
    }

    normalizeDisplacement(distanceVector, 1, '');

    if (lerp !== 1) {
      const lerpedDistance = distance * lerp;

      x = d.source.x + (distanceVector.x * lerpedDistance);
      y = d.source.y + (distanceVector.y * lerpedDistance);
    }

    const borderDisplacement = {
      x: distanceVector.x * borderDistance,
      y: distanceVector.y * borderDistance,
    };
    const sourceDisplacement = {
      x: d.source.currentRadius * distanceVector.x,
      y: d.source.currentRadius * distanceVector.y,
    };
    const targetDisplacement = {
      x: d.target.currentRadius * distanceVector.x,
      y: d.target.currentRadius * distanceVector.y,
    };

    if (Math.abs(d.source.x - x) < Math.abs(sourceDisplacement.x) + Math.abs(targetDisplacement.x)) {
      return null;
    }

    const start = {
      x: offsetX + ((d.source.x + sourceDisplacement.x) * zoom),
      y: (d.source.y + sourceDisplacement.y) * zoom,
    };
    const end = {
      x: offsetX + ((x - targetDisplacement.x) * zoom),
      y: (y - targetDisplacement.y) * zoom,
    };

    if (!isMobileSize || !d.source.rootNode) {
      start.x += borderDisplacement.x;
      start.y += borderDisplacement.y;
    }

    if (!isMobileSize || !d.target.rootNode) {
      end.x -= borderDisplacement.x;
      end.y -= borderDisplacement.y;
    }

    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);

    return { start, end };
  };

  // Draws a node (circle)
  const drawNode = (d, extraRadius = 0) => {
    const zoom = getZoom();
    let { currentRadius } = d;

    if (nodesAnimating.includes(d)) {
      currentRadius += extraRadius * getLerpingValue(stageTicksLeft);
    } else {
      currentRadius += extraRadius;
    }

    context.moveTo(offsetX + ((d.x + currentRadius) * zoom), d.y * zoom);
    context.arc(offsetX + (d.x * zoom), d.y * zoom, currentRadius * zoom, 0, 2 * Math.PI, false);
  };

  // Draws text inside a node
  const drawText = (d) => {
    const zoom = getZoom();
    const fontSize = fontSizes[d.size] * zoom;
    const maxWidth = (d.currentRadius * 2 * zoom) - TEXT_PADDING;
    const words = d.id.split(' ');
    const allLines = [];
    let currentWord = words[0];
    let i = 0;

    context.font = `normal normal 500 ${fontSize}px ${fontFamily}`;
    context.fillStyle = (d.root || d).fontColor || nodeTitleBaseColor;

    while (i <= words.length - 1) {
      if (i < words.length - 1) {
        const possibleSentence = `${currentWord} ${words[i + 1]}`;

        if (context.measureText(possibleSentence).width <= maxWidth) {
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
      context.fillText(text, offsetX + (d.x * zoom), (d.y + offset) * zoom);
    };
    const totalHeight = allLines.length * fontSize;
    const halfHeight = totalHeight / 4;

    allLines.forEach((line, index) => {
      const offset = ((index / allLines.length) * totalHeight) * (1 / zoom);

      drawTextWithOffset(line, allLines.length > 1 ? offset - halfHeight : 0);
    });
  };

  const drawIcon = (d) => {
    const zoom = getZoom();
    const x = (offsetX + (d.x * zoom)) - (d.icon.width / 2);
    const y = (d.y * zoom) - (d.icon.height / 2);

    if (d.icon) {
      context.drawImage(d.icon, x, y);
    }
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

          if (!node.rootNode) {
            const remainingNodeIndex = rootNodesRemaining.indexOf(node.root);

            if (remainingNodeIndex !== -1) {
              rootNodesRemaining.splice(remainingNodeIndex, 1);
            }
          }
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
      node.x = node.parent.x;
      node.y = node.parent.y;
      pushStageNode(node);
    });

    reSortStageNodes();

    newLinks.forEach(pushStageLink);
  };

  const onProcessTick = () => {
    const smooth = targetRootNodeToSelect ? ROOT_NODE_SELECTION_SCROLL_LERPING_SMOOTH : SCROLL_LERPING_SMOOTH;
    const startingOffsetX = targetRootNodeToSelect ? initialXWhenSelectingRootNode : offsetX;
    const offsetXChange = (targetOffsetX - startingOffsetX) * smooth * getZoom();
    const absoluteOffsetXChange = Math.abs(offsetXChange);
    const minimumEffectiveScroll = 0.5;

    offsetX = absoluteOffsetXChange > minimumEffectiveScroll ? offsetX + offsetXChange : targetOffsetX;

    if (scrolling) {
      if ((offsetXChange < 0 && offsetX < targetOffsetX) || (offsetXChange >= 0 && offsetX > targetOffsetX)) {
        offsetX = targetOffsetX;
      }

      if (absoluteOffsetXChange <= minimumEffectiveScroll || offsetX === targetOffsetX) {
        targetRootNodeToSelect = null;
        checkForNewNodes();

        if (!nodesAnimating.length && !linksAnimating.length) {
          onStageFinished();
        }
      }
    }

    scrolling = absoluteOffsetXChange > minimumEffectiveScroll;

    if (scrolling && !nodesAnimating.length && !linksAnimating.length && !scrollingStageFinishedTimeout) {
      scrollingStageFinishedTimeout = setTimeout(() => {
        scrollingStageFinishedTimeout = null;

        if (!expandOnlyOnSelected) {
          checkForNewNodes();
        }

        if (!nodesAnimating.length && !linksAnimating.length) {
          onStageFinished();
        }
      }, 50);
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
    context.clearRect(0, 0, canvas.width, canvas.height);

    const zoom = getZoom();
    const isMobileSize = isMobile();

    stageNodesByRoot.sortedRoots.forEach((rootNode) => {
      const nodesToDraw = stageNodesByRoot[rootNode.id];

      nodesToDraw.forEach((node) => {
        const mobileIndex = node.size === 0 ? 0 : nodeSizes.length - 1;
        const index = isMobileSize ? mobileIndex : node.size;
        let radius = nodeSizes[index];

        if (nodesAnimating.includes(node)) {
          const ticksRatio = getLerpingValue(stageTicksLeft);

          radius *= ticksRatio;
        }

        node.currentRadius = radius;
      });
    });

    // Draw all the regular dashed lines
    context.beginPath();
    stageLinksByType.normal.forEach(d => drawLink(d, 1, isMobileSize));
    linksAnimating.forEach(d => drawLink(d, getLerpingValue(stageTicksLeft), isMobileSize));
    // Fix the bug where canvas stretches or doesn't draw the last line properly
    context.moveTo(0, 0);
    context.lineTo(0, 0);
    context.setLineDash([4, 3]);
    context.strokeStyle = linkLineColor;
    context.lineWidth = NODE_BORDER_WIDTH;
    context.closePath();
    context.stroke();

    // Draw all the solid lines connecting the roots
    context.setLineDash([]);
    context.lineWidth = isMobileSize ? ROOT_NODE_LINK_LINE_WIDTH / 2 : ROOT_NODE_LINK_LINE_WIDTH;
    stageLinksByType.root.forEach((link) => {
      context.beginPath();

      const path = drawLink(link, 1, isMobileSize);

      if (!path) {
        return;
      }

      const gradient = context.createLinearGradient(path.start.x, path.start.y, path.end.x, path.end.y);

      gradient.addColorStop(0, link.source.color);
      gradient.addColorStop(1, link.target.color);

      context.strokeStyle = gradient;
      context.closePath();
      context.stroke();
    });

    // Draw all borders
    stageNodesByRoot.sortedRoots.forEach((rootNode) => {
      const nodesToDraw = stageNodesByRoot[rootNode.id];
      const borderDistance = Math.min(Math.max(BORDER_DISTANCE * (1 / zoom), 3), 4);

      // Dotted borders
      context.strokeStyle = linkLineColor;
      context.lineWidth = NODE_BORDER_WIDTH;
      context.setLineDash([4, 3]);
      context.beginPath();
      nodesToDraw.forEach(d => !d.rootNode && drawNode(d, borderDistance));
      context.closePath();
      context.stroke();

      if (!isMobileSize) {
        // Solid borders
        context.strokeStyle = rootNode.color;
        context.lineWidth = NODE_BORDER_WIDTH;
        context.setLineDash([]);
        context.beginPath();
        drawNode(rootNode, borderDistance);
        context.closePath();
        context.stroke();
      }

      // Draw nodes
      context.fillStyle = rootNode.color ? rootNode.color : '#000';
      context.beginPath();
      nodesToDraw.forEach(d => drawNode(d));
      context.closePath();
      context.fill();

      // Draw node titles
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      nodesToDraw.forEach((node) => {
        if (node.animationFinished) {
          if (!isMobileSize || !node.icon) {
            drawText(node);
          } else {
            drawIcon(node);
          }
        }
      });
    });
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
    if (!expandOnlyOnSelected) {
      checkForNewNodes();
    }

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
    setOffsets(false);
    reCenterNodes();

    if (selectedRootNode && focusSelectedRootNodeOnResize) {
      targetOffsetX = getTargetNodeOffsetX(selectedRootNode);

      setTimeout(() => {
        targetOffsetX = getTargetNodeOffsetX(selectedRootNode);
      });
    }
  });

  window.addEventListener('scroll', function _onWindowScroll() {
    windowScrollListener = _onWindowScroll;
    onWindowResizeOrScroll();
  }, true);

  if (!disableCanvasScrolling) {
    canvas.addEventListener('wheel', function _onCanvasWheel(event) {
      event.preventDefault();
      canvasWheelListener = _onCanvasWheel;
      targetRootNodeToSelect = null;

      if (!expandOnlyOnSelected) {
        checkForNewNodes();
      }

      setOffsets(false, event);
      reheatSimulation();

      listeners[EVENT_TYPES.SCROLL].forEach((callback) => {
        callback(event);
      });

      return false;
    }, false);
  }

  simulation.getSelectedRootNode = () => selectedRootNode;
  simulation.setSelectedRootNode = (id) => {
    const nodeById = rootNodes.find(node => node.id === id);

    if (nodeById) {
      targetOffsetX = getTargetNodeOffsetX(nodeById);
      nodeById.hasBeenSelected = true;
      initialXWhenSelectingRootNode = offsetX;
      targetRootNodeToSelect = nodeById;
      selectedRootNode = nodeById;
      reheatSimulation();

      if (expandOnlyOnSelected) {
        checkForNewNodes();

        if (!nodesAnimating.length && !linksAnimating.length && Math.abs(targetOffsetX - offsetX) === 0) {
          onStageFinished();
        }
      }

      listeners[EVENT_TYPES.SELECTED_ROOT_NODE_CHANGE].forEach((callback) => {
        callback(nodeById);
      });
    }
  };

  simulation.resetScrolling = () => setOffsets(true);

  simulation.addListener = ((type, callback) => {
    if (listeners[type]) {
      listeners[type].push(callback);
    }
  });

  simulation.removeListener = ((type, callback) => {
    if (listeners[type]) {
      const listenersOfType = listeners[type];
      const index = listenersOfType.indexOf(callback);

      if (!callback) {
        listeners[type] = [];
      } else if (index !== -1) {
        listenersOfType.splice(index, 1);
      }
    }
  });

  return simulation;
};

export {
  EVENT_TYPES,
  runSimulation,
};
