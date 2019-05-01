import {
  NODE_INITAL_DISTANCE_FROM_PARENT,
  NODE_MARGIN,
  ROOT_NODE_INITIAL_X_POSITION,
  ROOT_NODE_X_DISTANCE,
  SIZES,
} from './constants';

// Max iterations to go in a full circle when calculating position around a parent
const MAX_ITERATIONS = 10;

// Returns a link object from 2 nodes
const getLink = (source, target, external = false) => ({ source, target, external });

// Gets the linked node
const getOtherNodeFromLink = (link, node) => {
  if (typeof link.source === 'object' && link.source.id === node.id) {
    return link.target;
  }

  if (typeof link.source !== 'object' && link.source === node.id) {
    return link.target;
  }

  return link.source;
};

// Gets the minimum distance from a child node to a parent node with no space in-between
const getChildNodeDistance = node => SIZES[node.parent.size] + SIZES[node.size];

// Normalizes a vector and multiplies it by a scale
const normalizeDisplacement = (point, scale = 1, propertyPrefix = 'd') => {
  const xProperty = `${propertyPrefix}x`;
  const yProperty = `${propertyPrefix}y`;
  const x = point[xProperty];
  const y = point[yProperty];
  const norm = Math.sqrt((x * x) + (y * y));

  if (norm !== 0) {
    point[xProperty] = scale * x / norm;
    point[yProperty] = scale * y / norm;
  }
};

// Assigns the proper properties to the child nodes
const assignChildren = (nodes, links, parent, children, level = 1, rootNode = null) => {
  nodes.push(parent);

  if (children) {
    const childNodes = children.map((child, index) => {
      const nodeLinks = [];

      if (child.children) {
        child.children.forEach((subChild) => {
          nodeLinks.push(getLink(child.title, subChild.title));
        });
      }

      links.push(...nodeLinks);

      return {
        id: child.title,
        siblingIndex: index,
        size: child.size,
        radius: SIZES[child.size],
        parent,
        root: rootNode || parent,
        level,
        children: child.children,
        links: nodeLinks,
        extraLinks: child.links,
      };
    });

    childNodes.forEach((childNode, index) => {
      childNode.last = index === 0 ? null : childNodes[index - 1];
      childNode.next = index === childNodes.length - 1 ? null : childNodes[index + 1];

      assignChildren(nodes, links, childNode, childNode.children, level + 1, rootNode || parent);
    });

    parent.children = childNodes;
  }
};

// Main function to parse the tree data received into nodes and links
const parseTreeData = (data, canvas) => {
  if (!data || !data.rootNodes || !data.rootNodes.length) {
    return null;
  }

  const nodesByRootIndex = {};
  const nodesByName = {};
  const nodes = [];
  const links = [];

  // Generate all nodes and links
  data.rootNodes.forEach((rootNodeData, index) => {
    const rootNodeLinks = [];

    if (index + 1 < data.rootNodes.length) {
      rootNodeLinks.push(getLink(rootNodeData.title, data.rootNodes[index + 1].title));
    }

    if (rootNodeData.children) {
      rootNodeData.children.forEach((child) => {
        rootNodeLinks.push(getLink(rootNodeData.title, child.title));
      });
    }

    const rootNode = {
      id: rootNodeData.title,
      siblingIndex: index,
      size: rootNodeData.size,
      radius: SIZES[rootNodeData.size],
      rootNode: true,
      links: rootNodeLinks,
      extraLinks: rootNodeData.links,
    };

    links.push(...rootNodeLinks);
    nodesByRootIndex[index] = rootNode;
    assignChildren(nodes, links, rootNode, rootNodeData.children);
  });

  // Assign next/last/parent to root nodes
  nodes.forEach((node) => {
    nodesByName[node.id] = node;

    if (node.rootNode) {
      node.next = nodesByRootIndex[node.siblingIndex + 1] || null;
      node.last = nodesByRootIndex[node.siblingIndex - 1] || null;
      node.parent = node.last;
    }
  });

  // Create external links (child nodes linked to child nodes of a different root node)
  nodes.forEach((node) => {
    if (node.extraLinks) {
      node.extraLinks.forEach((id) => {
        const linkedNode = nodesByName[id];

        if (linkedNode.extraLinks) {
          linkedNode.extraLinks.splice(linkedNode.extraLinks.indexOf(node.id), 1);
        }

        const link = getLink(node.id, linkedNode.id, true);

        links.push(link);
        node.links.push(link);
        linkedNode.links.push(link);
      });

      node.extraLinks = null;
    }
  });

  // Check if the node is colliding with any other nodes or if its link line is colliding
  const isNodeColliding = (nodeToCheck) => {
    const minY = nodeToCheck.fy - nodeToCheck.radius - NODE_MARGIN;
    const maxY = nodeToCheck.fy + nodeToCheck.radius + NODE_MARGIN;
    const canvasMiddleY = canvas.height / 2;

    // Check against top and bottom canvas bounds
    if (minY < 0 || nodeToCheck.fx - nodeToCheck.radius < 0 || maxY > canvas.height) {
      return true;
    }

    // Check against canvas mid-point as no node besides a root node can overlap the middle line
    if ((nodeToCheck.fy > canvasMiddleY && minY < canvasMiddleY) || (nodeToCheck.fy <= canvasMiddleY && maxY >= canvasMiddleY)) {
      return true;
    }

    const lines = [];

    // Get all the lines associated with the links
    if (nodeToCheck.links) {
      nodeToCheck.links.forEach((link) => {
        const linkedNode = nodesByName[getOtherNodeFromLink(link, nodeToCheck)];

        if (linkedNode.parent !== link.parent && linkedNode.positionAssigned) {
          let minX = nodeToCheck.fx;
          let maxX = linkedNode.fx;

          if (maxX < minX) {
            const temp = maxX;
            maxX = minX;
            minX = temp;
          }

          lines.push((x, nodeBeingChecked) => {
            if (nodeBeingChecked === linkedNode || nodeBeingChecked.fx < minX || nodeBeingChecked.fx > maxX) {
              return 0;
            }

            const slope = (linkedNode.fy - nodeToCheck.fy) / (linkedNode.fx - nodeToCheck.fx);
            const b = linkedNode.fy - (slope * linkedNode.fx);

            return (slope * x) + b;
          });
        }
      });
    }

    // Check every single node against the link lines of the nodeToCheck
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];

      if (node !== nodeToCheck && node.positionAssigned) {
        const distance = Math.sqrt(((node.fx - nodeToCheck.fx) ** 2) + ((node.fy - nodeToCheck.fy) ** 2));

        if (distance < node.radius + nodeToCheck.radius + 20) {
          return true;
        }

        const nodeMinY = node.fy - node.radius;
        const nodeMaxY = node.fy + node.radius;

        for (let j = 0; j < lines.length; j += 1) {
          const line = lines[j];
          const lineXPositions = [node.fx - node.radius, node.fx, node.fx + node.radius];

          for (let x = 0; x < lineXPositions.length; x += 1) {
            const lineY = line(lineXPositions[x], node);

            if (lineY && lineY > nodeMinY - NODE_MARGIN && lineY < nodeMaxY + NODE_MARGIN) {
              return node;
            }
          }
        }
      }
    }

    return false;
  };

  // Moves a node in a certain direction (rangeLimit limits the circumference the node can move into while is it colliding with other nodes)
  const moveNode = (node, direction, distance, rangeLimit) => {
    normalizeDisplacement(direction, distance, '');

    const initialPosition = { x: node.fx, y: node.fy };
    let initialAngle = Math.atan2(direction.y, direction.x);
    let dir = direction;
    let iteration = 0;
    let nodeCollided = null;

    const handleMaxIterations = () => {
      if (iteration && iteration % MAX_ITERATIONS === 0) {
        if (typeof nodeCollided === 'object' && !nodeCollided.rootNode) {
          nodeCollided.fx = nodeCollided.parent.fx;
          nodeCollided.fy = nodeCollided.parent.fy;

          const x = Math.sign(node.fx - nodeCollided.fx);
          const y = Math.sign(node.root.fy - node.fy) * 0.1;

          moveNode(nodeCollided, { x, y }, nodeCollided.distanceFromParent);
        } else {
          distance += 10;
        }
      }
    };

    while (dir) {
      node.fx = initialPosition.x + dir.x;
      node.fy = initialPosition.y + dir.y;

      if (rangeLimit) {
        while (initialAngle >= rangeLimit.from && initialAngle <= rangeLimit.to) {
          initialAngle += Math.PI / MAX_ITERATIONS;
          iteration += 1;

          handleMaxIterations();
        }
      }

      if (nodeCollided = isNodeColliding(node)) {
        initialAngle += Math.PI / MAX_ITERATIONS;

        dir.x = Math.cos(initialAngle) * distance;
        dir.y = Math.sin(initialAngle) * distance;

        handleMaxIterations();
      } else {
        dir = null;
      }

      iteration += 1;
    }

    node.distanceFromParent = distance;
    node.directionFromParent = direction;
  };

  // Assigns the position of a node (Will auto-assign position of root nodes and parents of this node if they are not assigned yet)
  const assignNodePosition = (node, directionRadiansAngle = null) => {
    if (node.positionAssigned) {
      return;
    }

    if (!node.rootNode) {
      node.fx = node.parent.fx;
      node.fy = node.parent.fy;
    }

    if (node.rootNode) {
      node.fx = ROOT_NODE_INITIAL_X_POSITION + (node.siblingIndex * ROOT_NODE_X_DISTANCE);
      node.fy = canvas.height / 2;

      node.positionAssigned = true;
    } else {
      const nodeSiblingIndexXModifier = node.root.next ? 0 : 2;
      let defaultX = 1;
      let defaultY = 0.7;

      if (node.parent.rootNode) {
        defaultX = 0.65;
        defaultY = 1;
      }

      if (node.parent.rootNode && node.parent.siblingIndex !== 0 && (node.siblingIndex + nodeSiblingIndexXModifier) % 4 < 2) {
        defaultX *= -1;
      }

      let x = defaultX;
      let y = node.siblingIndex % 2 === 0 ? -defaultY : defaultY;

      // Change node direction to match it with an external linked node
      // (Such as putting both on the top to make their lines less likely to cross the middle or other nodes)
      for (let i = 0; i < node.links.length; i += 1) {
        const linkedNode = nodesByName[getOtherNodeFromLink(node.links[i], node)];

        if (linkedNode.root !== node.root && !linkedNode.rootNode && !node.rootNode && linkedNode.positionAssigned) {
          if (!linkedNode.root.positionAssigned) {
            assignNodePosition(linkedNode.root);
          }

          x = Math.sign(linkedNode.root.fx - node.parent.fx);
          y = Math.sign((linkedNode.fy ? linkedNode.fy : linkedNode.root.fy) - node.parent.fy);

          if (x && y) {
            x /= 2;
            y /= 2;
          }

          break;
        }
      }

      // Curve sub-sequents child nodes toward the middle
      if (node.level > 2) {
        y *= 1 - (-Math.sign(y) * (node.level * 0.2));
      }

      // If directionRadiansAngle was specified, get x and y from it
      if (directionRadiansAngle) {
        x = Math.cos(directionRadiansAngle);
        y = Math.sin(directionRadiansAngle);
      }

      moveNode(node, { x, y }, getChildNodeDistance(node) + NODE_INITAL_DISTANCE_FROM_PARENT);
      node.positionAssigned = true;

      const externalLinkedNodes = [];
      let minExternalLinkedYPosition = 100000;
      let maxExternalLinkedYPosition = 0;

      // Fix position of this node based on the linked nodes
      node.links.forEach((link) => {
        const linkedNode = nodesByName[getOtherNodeFromLink(link, node)];
        const halfCanvasHeight = canvas.height / 2;

        // Try to move nodes with the same parent who are linked together closer together
        if (linkedNode.parent === node.parent && !linkedNode.positionAssigned) {
          const displacement = Math.sign(x) * (Math.PI / 3);

          assignNodePosition(linkedNode, Math.atan2(y, x) + displacement);
        }

        // Make sure no lines are crossing the middle
        if (
          linkedNode.parent !== node.parent
          && linkedNode.positionAssigned
          && (
            (linkedNode.fy < halfCanvasHeight && node.fy > halfCanvasHeight)
            || (linkedNode.fy > halfCanvasHeight && node.fy < halfCanvasHeight)
          )
        ) {
          let min = 0;
          let max = 0;
          let xDir = Math.sign(node.fx - linkedNode.fx);
          let yDir = Math.sign(node.fy - node.root.fy);

          if (xDir === 1) {
            if (yDir === 1) {
              max = Math.PI / 2;
              yDir = 0.1;
            } else {
              min = Math.PI * 1.5;
              max = Math.PI * 2;
              xDir = 0.1;
            }
          } else if (yDir === 1) {
            min = Math.PI / 2;
            max = Math.PI;
            xDir = 0;
          } else {
            min = Math.PI;
            max = Math.PI * 1.5;
            yDir = -0.1;
          }

          linkedNode.fx = linkedNode.parent.fx;
          linkedNode.fy = linkedNode.parent.fy;

          moveNode(linkedNode, { x: xDir, y: yDir }, linkedNode.distanceFromParent, { from: min, to: max });
        }

        if (
          linkedNode.parent !== node.parent
          && linkedNode.positionAssigned
          && (Math.sign(node.fy - node.root.fy) === Math.sign(linkedNode.fy - linkedNode.root.fy))
        ) {
          externalLinkedNodes.push(linkedNode);

          if (linkedNode.fy < minExternalLinkedYPosition) {
            minExternalLinkedYPosition = linkedNode.fy;
          }

          if (linkedNode.fy > maxExternalLinkedYPosition) {
            maxExternalLinkedYPosition = linkedNode.fy;
          }
        }
      });

      // Try to make full circle links look better
      if (externalLinkedNodes.length > 1) {
        let yDir = 1;
        const distance = (maxExternalLinkedYPosition - minExternalLinkedYPosition) / 2;

        if (Math.abs(node.fy - minExternalLinkedYPosition) > (Math.abs(maxExternalLinkedYPosition - node.fy))) {
          yDir = -1;
        }

        moveNode(node, { x: 0, y: yDir }, node.fy - (minExternalLinkedYPosition + distance));

        externalLinkedNodes.forEach((linkedNode) => {
          const targetX = linkedNode.parent.fx + ((node.fx - linkedNode.parent.fx) / 2);

          moveNode(linkedNode, { x: Math.sign(node.fx - linkedNode.fx), y: 0 }, Math.abs(targetX - linkedNode.fx));
        });
      }
    }
  };

  nodes.forEach(node => assignNodePosition(node));

  return {
    nodes,
    links,
    originalData: data,
  };
};

export {
  normalizeDisplacement,
  parseTreeData,
};
