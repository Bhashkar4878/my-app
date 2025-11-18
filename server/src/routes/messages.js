const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// List conversations for the logged-in user
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username')
      .lean();

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await Message.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'username')
          .lean();

        const participants = conv.participants.map((p) => ({
          id: p._id.toString(),
          username: p.username,
          isSelf: p._id.toString() === req.user.id.toString(),
        }));

        return {
          id: conv._id.toString(),
          participants,
          lastMessage: lastMsg
            ? {
                id: lastMsg._id.toString(),
                senderUsername: lastMsg.sender.username,
                text: lastMsg.text,
                createdAt: lastMsg.createdAt,
              }
            : null,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error('List conversations error', err);
    res.status(500).json({ message: 'Could not load conversations' });
  }
});

// Get messages in a conversation
router.get('/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')
      .lean();

    res.json(
      messages.map((m) => ({
        id: m._id.toString(),
        senderId: m.sender._id.toString(),
        senderUsername: m.sender.username,
        text: m.text,
        createdAt: m.createdAt,
      }))
    );
  } catch (err) {
    console.error('Get messages error', err);
    res.status(500).json({ message: 'Could not load messages' });
  }
});

// Start or get a conversation with another user + send first message
router.post('/start', async (req, res) => {
  const { toUsername, text } = req.body || {};
  if (!toUsername || !text) {
    return res
      .status(400)
      .json({ message: 'Recipient username and text are required' });
  }

  try {
    const other = await User.findOne({
      usernameLower: toUsername.trim().toLowerCase(),
    });
    if (!other) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (other._id.equals(req.user.id)) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    // Find existing 2-person conversation or create new
    let conv = await Conversation.findOne({
      participants: { $all: [req.user.id, other._id], $size: 2 },
    });
    if (!conv) {
      conv = await Conversation.create({
        participants: [req.user.id, other._id],
        lastMessageAt: new Date(),
      });
    }

    const msg = await Message.create({
      conversation: conv._id,
      sender: req.user.id,
      text: text.trim(),
    });

    conv.lastMessageAt = msg.createdAt;
    await conv.save();

    res.status(201).json({
      conversationId: conv._id.toString(),
      message: {
        id: msg._id.toString(),
        senderId: req.user.id,
        senderUsername: req.user.username,
        text: msg.text,
        createdAt: msg.createdAt,
      },
    });
  } catch (err) {
    console.error('Start conversation error', err);
    res.status(500).json({ message: 'Could not start conversation' });
  }
});

// Send a message in an existing conversation
router.post('/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  try {
    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const msg = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      text: text.trim(),
    });

    conv.lastMessageAt = msg.createdAt;
    await conv.save();

    res.status(201).json({
      id: msg._id.toString(),
      senderId: req.user.id,
      senderUsername: req.user.username,
      text: msg.text,
      createdAt: msg.createdAt,
    });
  } catch (err) {
    console.error('Send message error', err);
    res.status(500).json({ message: 'Could not send message' });
  }
});

module.exports = router;


