// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Sentiment = require('sentiment');
const snoowrap = require('snoowrap');
require('dotenv').config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',  // Allow your GitHub Pages domain
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

app.get('/api/sentiment/:crypto', async (req, res) => {
  const { crypto } = req.params;
  try {
    const posts = await fetchRedditPosts(crypto);
    const analysis = analyzeSentiment(posts);
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching sentiment data:', error.message);
    res.status(500).json({ error: 'Failed to fetch sentiment data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
async function fetchRedditPosts(crypto) {
  const r = new snoowrap({
    userAgent: process.env.USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });

  const subreddit = 'cryptocurrency'; // You can customize this
  const query = crypto;
  const options = {
    query,
    sort: 'new',
    time: 'day',
    limit: 50,
  };

  const posts = await r.getSubreddit(subreddit).search(options);
  return posts.map((post) => post.title + ' ' + post.selftext);
}

// Helper function to analyze sentiment
function analyzeSentiment(posts) {
  const sentiment = new Sentiment();
  const results = posts.map((text) => sentiment.analyze(text));
  const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
  const averageScore = results.length ? totalScore / results.length : 0;

  // Generate word frequencies for word cloud
  const wordFrequencies = {};
  results.forEach((result) => {
    result.words.forEach((word) => {
      wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    });
  });

  return {
    averageScore: averageScore.toFixed(2),
    totalPosts: results.length,
    wordFrequencies,
  };
}