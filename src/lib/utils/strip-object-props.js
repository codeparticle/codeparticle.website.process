export default (object = {}, propsToStrip = {}) => {
  const newObj = Object.assign({}, object);
  const keys = Object.keys(propsToStrip);
  for (let i = 0; i < keys.length; i += 1) {
    delete newObj[keys[i]];
  }
  return newObj;
};
