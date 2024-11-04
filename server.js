// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Sentiment = require('sentiment');
const snoowrap = require('snoowrap');
require('dotenv').config();

const app = express();

// Update allowedOrigins to include both local and production URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://ysong01.github.io',
  'https://cryptostats.me',
];

// Update CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add a pre-flight route handler
app.options('*', cors());

// Add headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.BLOCKCHAIR_API_KEY;

// Existing endpoint for cryptocurrency stats
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

// New endpoint for sentiment analysis
app.get('/api/sentiment/:crypto', async (req, res) => {
  const { crypto } = req.params;
  const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD } = process.env;

  // Initialize Reddit API client
  const reddit = new snoowrap({
    userAgent: 'CryptoSentimentAnalyzer/1.0.0',
    clientId: REDDIT_CLIENT_ID,
    clientSecret: REDDIT_CLIENT_SECRET,
    username: REDDIT_USERNAME,
    password: REDDIT_PASSWORD,
  });

  try {
    // Fetch recent posts about the cryptocurrency
    const posts = await reddit.getSubreddit('all').search({
      query: crypto,
      sort: 'new',
      limit: 50,
      time: 'day',
    });

    const sentiment = new Sentiment();
    const results = [];

    // Analyze sentiment for each post
    posts.forEach((post) => {
      const analysis = sentiment.analyze(post.title + ' ' + post.selftext);
      results.push({
        title: post.title,
        score: analysis.score,
        comparative: analysis.comparative,
      });
    });

    // Calculate average sentiment score
    const averageScore =
      results.reduce((acc, curr) => acc + curr.score, 0) / results.length;

    res.json({
      averageScore,
      postsAnalyzed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error fetching data from Reddit API:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Reddit API' });
  }
});

// Update the blockchain monitoring endpoints
app.get('/api/blockchain/stats/:chain', async (req, res) => {
    const { chain } = req.params;
    try {
        const response = await axios.get(`https://api.blockchair.com/stats`, {
            params: {
                key: API_KEY
            }
        });
        // Extract specific chain data from the response
        const chainData = response.data.data[chain];
        if (!chainData) {
            return res.status(404).json({ error: 'Chain not found' });
        }
        res.json({ data: chainData });
    } catch (error) {
        console.error('Error fetching blockchain stats:', error.message);
        res.status(500).json({ error: 'Failed to fetch blockchain stats' });
    }
});

app.get('/api/blockchain/transactions/:chain', async (req, res) => {
    const { chain } = req.params;
    try {
        const response = await axios.get(`https://api.blockchair.com/stats`, {
            params: {
                key: API_KEY
            }
        });
        // Extract transaction data for the specific chain
        const chainData = response.data.data[chain];
        if (!chainData) {
            return res.status(404).json({ error: 'Chain not found' });
        }
        
        // Return relevant transaction data
        const transactionData = {
            transactions_24h: chainData.data.transactions_24h,
            mempool_transactions: chainData.data.mempool_transactions,
            mempool_size: chainData.data.mempool_size,
            mempool_tps: chainData.data.mempool_tps,
            largest_transaction_24h: chainData.data.largest_transaction_24h
        };
        
        res.json({ data: transactionData });
    } catch (error) {
        console.error('Error fetching blockchain transactions:', error.message);
        res.status(500).json({ error: 'Failed to fetch blockchain transactions' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
