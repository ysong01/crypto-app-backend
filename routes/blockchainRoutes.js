const express = require('express');
const axios = require('axios');
const router = express.Router();

const BLOCKCHAIR_API_KEY = process.env.BLOCKCHAIR_API_KEY; // Add this to your .env file

router.get('/stats/:chain', async (req, res) => {
    try {
        const { chain } = req.params;
        const response = await axios.get(
            `https://api.blockchair.com/${chain}/stats?key=${BLOCKCHAIR_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching blockchain stats' });
    }
});

router.get('/transactions/:chain', async (req, res) => {
    try {
        const { chain } = req.params;
        const response = await axios.get(
            `https://api.blockchair.com/${chain}/mempool/transactions?key=${BLOCKCHAIR_API_KEY}&limit=10`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transactions' });
    }
});

module.exports = router; 