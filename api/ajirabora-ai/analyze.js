import { db } from '../../src/lib/firebaseAdmin';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.AJIRABORA_AI_KEY) {
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
    return res.status(500).json({ error: 'Server error' });
  }
}