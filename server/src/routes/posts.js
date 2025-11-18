const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const { evaluatePostContent } = require('../utils/moderation');

const router = express.Router();

// Use the same path as in server/src/index.js for static file serving
// __dirname is server/src/routes, so we need to go up two levels to server/, then into uploads
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
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

router.get('/', async (req, res) => {
  const { cursor, limit } = req.query || {};

  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 20);
  const filter = {};

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      filter.createdAt = { $lt: cursorDate };
    }
  }

  try {
    const query = Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .populate('author', 'username profilePicture')
      .populate('comments.author', 'username profilePicture')
      .lean();

    const results = await query;
    const hasMore = results.length > pageSize;
    const slice = hasMore ? results.slice(0, pageSize) : results;

    const shaped = slice.map((post) => ({
      id: post._id.toString(),
      content: post.content,
      authorUsername: post.author?.username || 'unknown',
      authorProfilePicture: post.author?.profilePicture || null,
      createdAt: post.createdAt,
      imageUrl: post.imageUrl || null,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      isFlagged: Boolean(post.isFlagged),
      moderationCategories: Array.isArray(post.moderationCategories)
        ? post.moderationCategories
        : [],
      comments: Array.isArray(post.comments)
        ? post.comments.map((c) => ({
            id: c._id.toString(),
            authorUsername: c.author?.username || 'unknown',
            authorProfilePicture: c.author?.profilePicture || null,
            text: c.text,
            createdAt: c.createdAt,
            isFlagged: Boolean(c.isFlagged),
            moderationCategories: Array.isArray(c.moderationCategories)
              ? c.moderationCategories
              : [],
          }))
        : [],
    }));

    const nextCursor = hasMore
      ? slice[slice.length - 1]?.createdAt?.toISOString()
      : null;

    return res.json({ posts: shaped, nextCursor, hasMore });
  } catch (err) {
    console.error('Fetch posts error', err);
    return res.status(500).json({ message: 'Could not load posts' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  const { content } = req.body || {};
  const trimmed = content && content.trim();

  if (!trimmed) {
    return res.status(400).json({ message: 'Post content is required' });
  }

  const moderation = evaluatePostContent(trimmed);

  try {
    // Verify file was saved if image was uploaded
    if (req.file) {
      const filePath = req.file.path;
      console.log('Post image upload - file saved to:', filePath);
      if (!fs.existsSync(filePath)) {
        console.error('Post image was not saved to disk:', filePath);
        return res.status(500).json({ message: 'Image upload failed - file not saved to disk' });
      }
      console.log('Post image file exists, size:', fs.statSync(filePath).size, 'bytes');
    }

    const post = await Post.create({
      content: trimmed,
      author: req.user.id,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      isFlagged: !moderation.isAllowed,
      moderationCategories: moderation.isAllowed ? [] : moderation.reasons,
    });

    return res.status(201).json({
      id: post._id.toString(),
      content: post.content,
      authorUsername: req.user.username,
      createdAt: post.createdAt,
      imageUrl: post.imageUrl,
      likesCount: 0,
      comments: [],
      isFlagged: post.isFlagged,
      moderationCategories: post.moderationCategories,
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

  const trimmed = text.trim();
  const moderation = evaluatePostContent(trimmed);

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      author: req.user.id,
      text: trimmed,
      isFlagged: !moderation.isAllowed,
      moderationCategories: moderation.isAllowed ? [] : moderation.reasons,
    };

    post.comments.push(comment);
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      id: newComment._id.toString(),
      authorUsername: req.user.username,
      text: newComment.text,
      createdAt: newComment.createdAt,
      isFlagged: newComment.isFlagged,
      moderationCategories: newComment.moderationCategories,
    });
  } catch (err) {
    console.error('Comment post error', err);
    return res.status(500).json({ message: 'Could not add comment' });
  }
});

module.exports = router;

