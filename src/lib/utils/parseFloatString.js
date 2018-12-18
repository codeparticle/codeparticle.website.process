export default (string) => {
  let float = parseFloat(
    string.replace(/[^0-9.]/g, ''),
  );
  if (!float) float = 0;
  return float.toFixed(2);
};
