const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Post = require('../models/Post');

const router = express.Router();

// Use the same path as in server/src/index.js for static file serving
// __dirname is server/src/routes, so we need to go up two levels to server/, then into uploads
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    console.log('=== MULTER DESTINATION CALLED ===');
    console.log('File:', file.originalname, file.fieldname, file.mimetype);
    console.log('Uploads root:', uploadsRoot);
    console.log('Uploads root exists:', fs.existsSync(uploadsRoot));
    if (!fs.existsSync(uploadsRoot)) {
      console.log('Creating uploads directory:', uploadsRoot);
      fs.mkdirSync(uploadsRoot, { recursive: true });
    }
    cb(null, uploadsRoot);
  },
  filename(req, file, cb) {
    console.log('=== MULTER FILENAME CALLED ===');
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const filename = `${Date.now()}-${base}${ext}`;
    console.log('Multer saving file as:', filename);
    cb(null, filename);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    console.log('=== MULTER FILEFILTER CALLED ===');
    console.log('File:', file.originalname, file.fieldname, file.mimetype);
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      console.log('File accepted');
      cb(null, true);
    } else {
      console.log('File rejected - not an image');
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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
      id: user._id.toString(),
      username: user.username,
      bio: user.bio || '',
      location: user.location || 'Earth',
      website: user.website || 'yourwebsite.com',
      joinedAt: user.createdAt,
      profilePicture: user.profilePicture || null,
      bannerImage: user.bannerImage || null,
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
      .select('username bio profilePicture');

    // load current user's following list to compute isFollowing
    const me = await User.findById(req.user.id).select('following').lean();
    const followingSet = new Set((me?.following || []).map(id => id.toString()));

    const suggestions = users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      bio: u.bio || '',
      profilePicture: u.profilePicture || null,
      isFollowing: followingSet.has(u._id.toString()),
    }));

    res.json(suggestions);
  } catch (err) {
    console.error('Profile suggestions error', err);
    res.status(500).json({ message: 'Could not load suggestions' });
  }
});

// Public profile view by username
router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) return res.status(400).json({ message: 'Username is required' });
    const user = await User.findOne({ usernameLower: username.toLowerCase() }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).lean();

    // compute whether current user follows this user
    const me = await User.findById(req.user.id).select('following').lean();
    const isFollowing = (me?.following || []).some(id => id.toString() === user._id.toString());

    const likesReceived = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

    res.json({
      username: user.username,
      bio: user.bio || '',
      location: user.location || 'Earth',
      website: user.website || 'yourwebsite.com',
      joinedAt: user.createdAt,
      profilePicture: user.profilePicture || null,
      bannerImage: user.bannerImage || null,
      isFollowing,
      stats: {
        posts: posts.length,
        likesReceived,
        following: (user.following || []).length,
        followers: (user.followers || []).length,
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
    console.error('Public profile error', err);
    res.status(500).json({ message: 'Could not load profile' });
  }
});

// Toggle follow/unfollow by id
router.post('/:id/follow', async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!targetId) return res.status(400).json({ message: 'Target user id required' });
    if (targetId === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

    const target = await User.findById(targetId);
    const me = await User.findById(req.user.id);
    if (!target || !me) return res.status(404).json({ message: 'User not found' });

    const alreadyFollowing = (me.following || []).some(id => id.toString() === targetId.toString());
    if (alreadyFollowing) {
      me.following = (me.following || []).filter(id => id.toString() !== targetId.toString());
      target.followers = (target.followers || []).filter(id => id.toString() !== me._id.toString());
    } else {
      me.following = me.following || [];
      target.followers = target.followers || [];
      me.following.push(target._id);
      target.followers.push(me._id);
    }

    await me.save();
    await target.save();

    return res.json({ following: !alreadyFollowing });
  } catch (err) {
    console.error('Follow toggle error', err);
    res.status(500).json({ message: 'Could not update follow state' });
  }
});

router.put('/bio', async (req, res) => {
  const { bio } = req.body || {};
  if (typeof bio !== 'string') {
    return res.status(400).json({ message: 'Bio must be a string' });
  }

  const trimmed = bio.trim();
  if (trimmed.length > 160) {
    return res.status(400).json({ message: 'Bio must be 160 characters or less' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio: trimmed },
      { new: true, runValidators: true, lean: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ bio: user.bio || '' });
  } catch (err) {
    console.error('Update bio error', err);
    return res.status(500).json({ message: 'Could not update bio' });
  }
});

router.post('/picture', (req, res, next) => {
  console.log('=== POST /picture ROUTE HIT ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  console.log('Has body:', !!req.body);
  console.log('Request method:', req.method);
  
  upload.single('picture')(req, res, (err) => {
    if (err) {
      console.error('=== MULTER ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    console.log('=== MULTER SUCCESS ===');
    console.log('req.file:', req.file);
    console.log('req.file exists:', !!req.file);
    if (req.file) {
      console.log('File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('Profile picture upload - req.file:', req.file);
    console.log('Profile picture upload - req.body:', req.body);
    console.log('Uploads root:', uploadsRoot);
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No file uploaded. Please select an image file.' });
    }

    // Verify file was actually saved
    // Use req.file.path which multer provides (absolute path)
    const filePath = req.file.path;
    console.log('=== FILE PATH VERIFICATION ===');
    console.log('req.file.path (from multer):', filePath);
    console.log('Uploads root:', uploadsRoot);
    console.log('Uploads root absolute:', path.resolve(uploadsRoot));
    
    if (!fs.existsSync(filePath)) {
      console.error('=== FILE NOT FOUND ===');
      console.error('File was not saved to disk:', filePath);
      console.error('Uploads directory exists:', fs.existsSync(uploadsRoot));
      if (fs.existsSync(uploadsRoot)) {
        const files = fs.readdirSync(uploadsRoot);
        console.error('Uploads directory contents:', files);
        console.error('Number of files:', files.length);
      }
      return res.status(500).json({ message: 'File upload failed - file not saved to disk' });
    }
    console.log('=== FILE FOUND ===');
    console.log('File saved successfully to:', filePath);
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: `/uploads/${req.file.filename}` },
      { new: true, runValidators: true, lean: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile picture updated successfully:', user.profilePicture);
    return res.json({ profilePicture: user.profilePicture });
  } catch (err) {
    console.error('Update profile picture error', err);
    return res.status(500).json({ message: err.message || 'Could not update profile picture' });
  }
});

router.post('/banner', (req, res, next) => {
  console.log('=== POST /banner ROUTE HIT ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  console.log('Has body:', !!req.body);
  console.log('Request method:', req.method);
  
  upload.single('banner')(req, res, (err) => {
    if (err) {
      console.error('=== MULTER ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    console.log('=== MULTER SUCCESS ===');
    console.log('req.file:', req.file);
    console.log('req.file exists:', !!req.file);
    if (req.file) {
      console.log('File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('Banner upload - req.file:', req.file);
    console.log('Banner upload - req.body:', req.body);
    console.log('Uploads root:', uploadsRoot);
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No file uploaded. Please select an image file.' });
    }

    // Verify file was actually saved
    // Use req.file.path which multer provides (absolute path)
    const filePath = req.file.path;
    console.log('=== FILE PATH VERIFICATION ===');
    console.log('req.file.path (from multer):', filePath);
    console.log('Uploads root:', uploadsRoot);
    console.log('Uploads root absolute:', path.resolve(uploadsRoot));
    
    if (!fs.existsSync(filePath)) {
      console.error('=== FILE NOT FOUND ===');
      console.error('File was not saved to disk:', filePath);
      console.error('Uploads directory exists:', fs.existsSync(uploadsRoot));
      if (fs.existsSync(uploadsRoot)) {
        const files = fs.readdirSync(uploadsRoot);
        console.error('Uploads directory contents:', files);
        console.error('Number of files:', files.length);
      }
      return res.status(500).json({ message: 'File upload failed - file not saved to disk' });
    }
    console.log('=== FILE FOUND ===');
    console.log('File saved successfully to:', filePath);
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bannerImage: `/uploads/${req.file.filename}` },
      { new: true, runValidators: true, lean: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Banner updated successfully:', user.bannerImage);
    return res.json({ bannerImage: user.bannerImage });
  } catch (err) {
    console.error('Update banner error', err);
    return res.status(500).json({ message: err.message || 'Could not update banner' });
  }
});

module.exports = router;
