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

  const { userId, jobId, coverLetter, matchScore, matchReasons } = req.body;

  if (!userId || !jobId || !coverLetter) {
    return res.status(400).json({ error: 'userId, jobId, and coverLetter required' });
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

    if (!userDoc.exists || !jobDoc.exists) {
      return res.status(404).json({ error: 'User or job not found' });
    }

    // Create application
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
      appliedAt: new Date().toISOString()
    };

    const result = await db.collection('applications').add(application);

    return res.status(200).json({
      success: true,
      message: 'Application submitted!',
      applicationId: result.id
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}