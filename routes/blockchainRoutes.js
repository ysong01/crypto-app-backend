const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/stats/:chain', async (req, res) => {
    try {
        const { chain } = req.params;
        const response = await axios.get(
            `https://api.blockchair.com/${chain}/stats`
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
            `https://api.blockchair.com/${chain}/mempool/transactions?limit=10`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transactions' });
    }
});

module.exports = router; 