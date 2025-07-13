const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  'https://vpxjadjfkkgqobsbdwnw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweGphZGpma2tncW9ic2Jkd253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjkzNDAsImV4cCI6MjA2Nzk0NTM0MH0.QchMPd2mcBGFodg5mkL75Dq3IeWNq_TfOphPbAnOFlE'
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// GET endpoint
app.get('/messages', async (req, res) => {
  console.log('Fetching messages...');
  try {
    const { data, error } = await supabase
      .from('messages') // <- changed from 'chatter'
      .select('id, content, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message 
      });
    }

    console.log(`Retrieved ${data?.length || 0} messages`);
    res.json(data || []);
  } catch (err) {
    console.error('Server error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Server error',
      details: err.message 
    });
  }
});

// POST endpoint
app.post('/data', async (req, res) => {
  console.log('Received message:', req.body);
  try {
    const { content } = req.body;
    
    // Validation
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: "Message content is required" });
    }
    
    const trimmedContent = content.trim();
    if (trimmedContent === '') {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    
    if (trimmedContent.length > 500) {
      return res.status(400).json({ error: "Message too long (max 500 characters)" });
    }

    const { data, error } = await supabase
      .from('messages') // <- changed from 'chatter'
      .insert([{ content: trimmedContent }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Message saved:', data[0]);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error processing message:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: "Failed to save message",
      details: error.message 
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});