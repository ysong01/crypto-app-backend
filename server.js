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
        // Log the URL and params we're using
        console.log(`Fetching stats for ${chain}`);
        
        const response = await axios.get(`https://api.blockchair.com/${chain}/stats`, {
            params: {
                key: API_KEY
            }
        });
        
        // Log the raw response
        console.log('Raw Blockchair Response:', JSON.stringify(response.data, null, 2));
        
        if (!response.data || !response.data.data) {
            return res.status(404).json({ error: 'No data available' });
        }

        // Format the data
        const statsData = response.data.data;
        const formattedData = {
            blocks: statsData.blocks || 0,
            difficulty: statsData.difficulty || 0,
            hashrate_24h: statsData.hashrate_24h || 0,
            mempool_transactions: statsData.mempool_transactions || 0,
            transactions_24h: statsData.transactions_24h || 0,
            mempool_size: statsData.mempool_size || 0,
            mempool_tps: statsData.mempool_tps || 0
        };
        
        res.json({ data: formattedData });
    } catch (error) {
        console.error('Error fetching blockchain stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch blockchain stats',
            details: error.message 
        });
    }
});

app.get('/api/blockchain/transactions/:chain', async (req, res) => {
    const { chain } = req.params;
    try {
        const response = await axios.get(`https://api.blockchair.com/${chain}/stats`, {
            params: {
                key: API_KEY
            }
        });
        
        if (!response.data || !response.data.data) {
            return res.status(404).json({ error: 'No data available' });
        }

        const statsData = response.data.data;
        
        // Format transaction data
        const transactionData = [
            {
                type: '24h Transactions',
                value: statsData.transactions_24h || 0,
                count: statsData.transactions_24h || 0
            },
            {
                type: 'Mempool Transactions',
                value: statsData.mempool_transactions || 0,
                count: statsData.mempool_transactions || 0
            },
            {
                type: 'Mempool Size',
                value: statsData.mempool_size || 0,
                count: statsData.mempool_size || 0
            },
            {
                type: 'Transaction Rate (TPS)',
                value: statsData.mempool_tps || 0,
                count: statsData.mempool_tps || 0
            }
        ];
        
        res.json({ data: transactionData });
    } catch (error) {
        console.error('Error fetching blockchain transactions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch blockchain transactions',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
