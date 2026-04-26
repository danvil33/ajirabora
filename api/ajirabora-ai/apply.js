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

  const { userId, jobId, coverLetter, matchScore, matchReasons } = req.body;

  if (!userId || !jobId || !coverLetter) {
    return res.status(400).json({ error: 'userId, jobId, and coverLetter required' });
  }

  if (coverLetter.length < 20) {
    return res.status(400).json({ error: 'Cover letter must be at least 20 characters' });
  }

  try {
    // Check if already applied
    const existing = await db.collection('applications')
      .where('userId', '==', userId)
      .where('jobId', '==', jobId)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'You already applied for this job' });
    }

    // Get user and job
    const userDoc = await db.collection('users').doc(userId).get();
    const jobDoc = await db.collection('jobs').doc(jobId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const userData = userDoc.data();
    const jobData = jobDoc.data();

    // Create application
    const application = {
      userId,
      jobId,
      coverLetter,
      matchScore: matchScore || 0,
      matchReasons: matchReasons || [],
      status: 'pending',
      applicantName: userData.fullName || userData.name || 'Unknown',
      applicantEmail: userData.email,
      jobTitle: jobData.title,
      companyName: jobData.company,
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
    console.error('Application error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}