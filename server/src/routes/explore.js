const express = require('express');
const Post = require('../models/Post');

const router = express.Router();

// Very simple hashtag parser
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#(\w+)/g) || [];
  return matches.map((tag) => tag.toLowerCase());
}

// Trending hashtags from recent posts
router.get('/trending', async (_req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .select('content createdAt')
      .lean();

    const counts = new Map();
    posts.forEach((p) => {
      const tags = extractHashtags(p.content);
      tags.forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });

    const trending = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
      }));

    res.json(trending);
  } catch (err) {
    console.error('Trending error', err);
    res.status(500).json({ message: 'Could not load trending' });
  }
});

module.exports = router;


