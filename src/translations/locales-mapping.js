import localeData from './locale-data';

export const localesOptions = Object.keys(localeData).map(key => ({
  value: key,
  label: localeData[key].messages.label,
}));

export const localesMapping = Object.keys(localeData).reduce((previous, current) => {
  previous[current] = localeData[current].messages.label;
  return previous;
}, {});
