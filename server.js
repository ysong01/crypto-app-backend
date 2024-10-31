// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(
  cors({
    origin: 'https://ysong01.github.io', // Allow your GitHub Pages domain
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.BLOCKCHAIR_API_KEY;

app.get('/api/:crypto', async (req, res) => {
  const { crypto } = req.params;
  try {
    const response = await axios.get(`https://api.blockchair.com/${crypto}/stats`, {
      params: {
        key: API_KEY,
      },
    });
    res.json(response.data.data);
  } catch (error) {
    console.error('Error fetching data from Blockchair API:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Blockchair API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
