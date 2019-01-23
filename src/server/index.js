const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

const buildDirectory = path.resolve(__dirname, '../../build');

app.use(express.static(buildDirectory));

app.get('/ping', (req, res) => res.end('OK'));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`server listening on port ${PORT}`);
});
