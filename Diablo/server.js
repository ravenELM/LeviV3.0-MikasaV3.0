const express = require('express');
const fs = require('fs');
const cors = require('cors'); // If frontend is on a different origin
const app = express();
const PORT = 3000;

// WhatsApp bot dependencies (make sure conn and ownerIDs are properly imported or defined)
const { ownerIDs } = require('./config'); // Adjust path as needed
const conn = require('./index.cjs');// <- you must have the bot connection here

// Middleware
app.use(cors()); // Optional but helpful if frontend is separate
app.use(express.json());
app.use(express.static('public')); // Serve static files from /public

// Load messages
app.get('/messages', (req, res) => {
  fs.readFile('messages.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send("Error reading messages");
    res.json(JSON.parse(data));
  });
});

// Save a new message
app.post('/messages', (req, res) => {
  const { user, message } = req.body;
  if (!user || !message) return res.status(400).send("Invalid input");

  fs.readFile('messages.json', 'utf8', (err, data) => {
    let messages = [];
    if (!err && data) {
      try {
        messages = JSON.parse(data);
      } catch (e) {}
    }

    messages.push({ user, message });

    fs.writeFile('messages.json', JSON.stringify(messages, null, 2), err => {
      if (err) return res.status(500).send("Failed to save");
      res.status(200).send("Saved");
    });
  });
});

// WhatsApp Bot Message Handler
app.post('/api/send-mod-request', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    for (const owner of ownerIDs) {
      await conn.sendMessage(owner, { text: message });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[❌] Error sending WhatsApp message:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Start server (this must be last)
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});
