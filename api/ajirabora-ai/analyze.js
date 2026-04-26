import { db } from '../_utils/firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Check API key
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.AJIRABORA_AI_KEY;
    
    if (!expectedApiKey) {
      console.error('AJIRABORA_AI_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { userId, jobId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({ error: 'userId and jobId required' });
    }

    // Check if Firebase is initialized
    if (!db) {
      console.error('Firestore not initialized');
      return res.status(500).json({ error: 'Database connection error' });
    }

    // Get user and job
    const userDoc = await db.collection('users').doc(userId).get();
    const jobDoc = await db.collection('jobs').doc(jobId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: `User ${userId} not found` });
    }
    if (!jobDoc.exists) {
      return res.status(404).json({ error: `Job ${jobId} not found` });
    }

    return res.status(200).json({
      success: true,
      user: userDoc.data(),
      job: jobDoc.data()
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}