// testReddit.js
const snoowrap = require('snoowrap');
require('dotenv').config();

const reddit = new snoowrap({
  userAgent: 'TestScript/1.0.0 by /u/your_reddit_username',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

reddit.getMe().then((me) => {
  console.log(`Logged in as: ${me.name}`);
}).catch((error) => {
  console.error('Error:', error);
});
