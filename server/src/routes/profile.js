const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const likesReceived = posts.reduce(
      (sum, post) => sum + (post.likes?.length || 0),
      0
    );

    res.json({
      username: user.username,
      bio: user.bio || 'No bio yet.',
      location: user.location || 'Earth',
      website: user.website || 'yourwebsite.com',
      joinedAt: user.createdAt,
      stats: {
        posts: posts.length,
        likesReceived,
        following: 0,
        followers: 0,
      },
      posts: posts.map((post) => ({
        id: post._id.toString(),
        content: post.content,
        createdAt: post.createdAt,
        imageUrl: post.imageUrl || null,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
      })),
    });
  } catch (err) {
    console.error('Profile me error', err);
    res.status(500).json({ message: 'Could not load profile' });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username bio');

    const suggestions = users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      bio: u.bio || 'New to X',
    }));

    res.json(suggestions);
  } catch (err) {
    console.error('Profile suggestions error', err);
    res.status(500).json({ message: 'Could not load suggestions' });
  }
});

module.exports = router;


