const express = require('express');
const delhiCaseRoutes = require('./routes/delhi-court-routes');
const andhraCasesRoutes = require('./routes/andhra-court-routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api/cases/delhi', delhiCaseRoutes);
app.use('/api/cases/andhra', andhraCasesRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
