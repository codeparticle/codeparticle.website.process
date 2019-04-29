const getLink = (source, target) => ({ source, target });

const assignChildren = (nodes, links, parent, children, level = 1) => {
  nodes.push(parent);

  if (children) {
    const childNodes = children.map((child) => {
      const nodeLinks = [];

      if (child.children) {
        child.children.forEach((subChild) => {
          nodeLinks.push(getLink(child.title, subChild.title));
        });
      }

      links.push(...nodeLinks);

      return {
        id: child.title,
        size: child.size,
        parent,
        level,
        children: child.children,
        links: nodeLinks,
      };
    });

    childNodes.forEach((childNode) => {
      assignChildren(nodes, links, childNode, childNode.children, level + 1);
    });

    parent.children = childNodes;
  }
};

const parseTreeData = (data) => {
  if (!data || !data.rootNodes || !data.rootNodes.length) {
    return null;
  }

  const nodesByRootIndex = {};
  const nodes = [];
  const links = [];

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
      size: rootNodeData.size,
      rootIndex: index,
      rootNode: true,
      links: rootNodeLinks,
    };

    links.push(...rootNodeLinks);
    nodesByRootIndex[index] = rootNode;
    assignChildren(nodes, links, rootNode, rootNodeData.children);
  });

  nodes.forEach((node) => {
    if (node.rootNode) {
      node.nextSibling = nodesByRootIndex[node.rootIndex + 1] || null;
      node.parent = nodesByRootIndex[node.rootIndex - 1] || null;
    }
  });

  const transitionStages = [{ nodes: [nodes[0]], links: [] }];
  let currentIndex = 0;

  while (currentIndex < transitionStages.length) {
    const newTransitionStage = { nodes: [], links: [] };

    transitionStages[currentIndex].nodes.forEach((node) => {
      if (node.links) {
        newTransitionStage.links.push(...node.links);
      }

      if (node.rootNode && node.nextSibling) {
        newTransitionStage.nodes.push(node.nextSibling);
      }

      if (node.children) {
        newTransitionStage.nodes.push(...node.children);
      }
    });

    if (newTransitionStage.nodes.length) {
      transitionStages.push(newTransitionStage);
    }

    currentIndex += 1;
  }

  return {
    nodes,
    links,
    transitionStages,
    originalData: data,
  };
};

const normalizeDisplacement = (point, scale = 1) => {
  const norm = Math.sqrt(point.dx * point.dx + point.dy * point.dy);

  if (norm !== 0) {
    point.dx = scale * point.dx / norm;
    point.dy = scale * point.dy / norm;
  }
};

export {
  normalizeDisplacement,
  parseTreeData,
};
