import { db } from '../_utils/firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.AJIRABORA_AI_KEY;

  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId required' });
  }

  try {
    // Get job details
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get all applications
    const applicationsQuery = await db.collection('applications')
      .where('jobId', '==', jobId)
      .get();

    const applicants = [];
    
    for (const appDoc of applicationsQuery.docs) {
      const appData = appDoc.data();
      const userDoc = await db.collection('users').doc(appData.userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        applicants.push({
          applicationId: appDoc.id,
          userId: appData.userId,
          name: userData.fullName || userData.name || 'Unknown',
          email: userData.email || '',
          phone: userData.phone || '',
          skills: userData.skills || [],
          experience: userData.experience || '',
          education: userData.education || '',
          hasResume: !!userData.resumeUrl,
          resumeUrl: userData.resumeUrl || null,
          coverLetter: appData.coverLetter || '',
          appliedAt: appData.appliedAt
        });
      }
    }

    return res.status(200).json({
      success: true,
      job: {
        id: jobId,
        title: jobDoc.data().title,
        company: jobDoc.data().company,
        description: jobDoc.data().description,
        requirements: jobDoc.data().requirements,
        skills: jobDoc.data().skills || []
      },
      applicants: applicants,
      totalApplicants: applicants.length
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}