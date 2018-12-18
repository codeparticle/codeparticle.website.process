export const areDataPtsValid = (dataPts) => {
  if (!dataPts) {
    console.warn('no dataPts supplied to a resolver');
    return false;
  }
  if (!Array.isArray(dataPts)) {
    console.warn('dataPts arg for resolveData must be an array');
    return false;
  }
  if (dataPts.length < 1) {
    // silent failure
    return false;
  }
  for (let i = 0; i < dataPts.length; i += 1) {
    const pt = dataPts[i];
    if (!pt.requestAction || !pt.selectorKey || !pt.propKey) {
      console.warn(`check shape for pt ${pt} in dataPts ${dataPts}.
        Must take props for 'requestAction', 'selectorKey', and 'propKey'`,
      );
      return false;
    }
  }
  return true;
};

export const getComponentStateMappers = (dataPts) => {
  const componentStateSelectors = {
    activeRequests: 'getActiveRequests',
    currentQuery: 'getCurrentQuery',
  };
  for (let i = 0; i < dataPts.length; i += 1) {
    const dp = dataPts[i];
    componentStateSelectors[dp.propKey] = dp.selectorKey;
  }
  return componentStateSelectors;
};
