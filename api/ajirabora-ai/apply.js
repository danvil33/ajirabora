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
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.AJIRABORA_AI_KEY;
    
    if (!expectedApiKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { userId, jobId, coverLetter, matchScore, matchReasons } = req.body;

    if (!userId || !jobId || !coverLetter) {
      return res.status(400).json({ error: 'userId, jobId, and coverLetter required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    // Check existing application
    const existing = await db.collection('applications')
      .where('userId', '==', userId)
      .where('jobId', '==', jobId)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const jobDoc = await db.collection('jobs').doc(jobId).get();

    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    if (!jobDoc.exists) return res.status(404).json({ error: 'Job not found' });

    const application = {
      userId,
      jobId,
      coverLetter,
      matchScore: matchScore || 0,
      matchReasons: matchReasons || [],
      status: 'pending',
      applicantName: userDoc.data().fullName || userDoc.data().name || 'Unknown',
      applicantEmail: userDoc.data().email,
      jobTitle: jobDoc.data().title,
      companyName: jobDoc.data().company,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('applications').add(application);

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: result.id
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}