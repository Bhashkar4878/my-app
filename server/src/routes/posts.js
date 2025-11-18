const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');

const router = express.Router();

const uploadsRoot = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsRoot);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({ storage });

router.get('/', async (_req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .populate('comments.author', 'username')
      .lean();

    const shaped = posts.map((post) => ({
      id: post._id.toString(),
      content: post.content,
      authorUsername: post.author?.username || 'unknown',
      createdAt: post.createdAt,
      imageUrl: post.imageUrl || null,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      comments: Array.isArray(post.comments)
        ? post.comments.map((c) => ({
            id: c._id.toString(),
            authorUsername: c.author?.username || 'unknown',
            text: c.text,
            createdAt: c.createdAt,
          }))
        : [],
    }));

    return res.json(shaped);
  } catch (err) {
    console.error('Fetch posts error', err);
    return res.status(500).json({ message: 'Could not load posts' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  const { content } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Post content is required' });
  }

  try {
    const post = await Post.create({
      content: content.trim(),
      author: req.user.id,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });

    return res.status(201).json({
      id: post._id.toString(),
      content: post.content,
      authorUsername: req.user.username,
      createdAt: post.createdAt,
      imageUrl: post.imageUrl,
      likesCount: 0,
      comments: [],
    });
  } catch (err) {
    console.error('Create post error', err);
    return res.status(500).json({ message: 'Could not create post' });
  }
});

router.post('/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likes.some(
      (uid) => uid.toString() === req.user.id.toString()
    );

    if (!alreadyLiked) {
      post.likes.push(req.user.id);
      await post.save();
    }

    return res.json({ likesCount: post.likes.length });
  } catch (err) {
    console.error('Like post error', err);
    return res.status(500).json({ message: 'Could not like post' });
  }
});

router.post('/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      author: req.user.id,
      text: text.trim(),
    };

    post.comments.push(comment);
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      id: newComment._id.toString(),
      authorUsername: req.user.username,
      text: newComment.text,
      createdAt: newComment.createdAt,
    });
  } catch (err) {
    console.error('Comment post error', err);
    return res.status(500).json({ message: 'Could not add comment' });
  }
});

module.exports = router;

