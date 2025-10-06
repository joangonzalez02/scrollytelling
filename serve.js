const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8000;

app.use(express.static(__dirname));

// Express 5: use a regex catch-all to avoid path-to-regexp '*' breaking changes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
