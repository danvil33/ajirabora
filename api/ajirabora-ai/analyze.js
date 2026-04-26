import { db } from '../_utils/firebaseAdmin';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.AJIRABORA_AI_KEY;
  
  if (!expectedKey) {
    console.error('AJIRABORA_AI_KEY not configured in Vercel');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { userId, jobId } = req.body;

  if (!userId || !jobId) {
    return res.status(400).json({ error: 'userId and jobId required' });
  }

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get job data
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Send back data
    return res.status(200).json({
      success: true,
      user: userDoc.data(),
      job: jobDoc.data()
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}