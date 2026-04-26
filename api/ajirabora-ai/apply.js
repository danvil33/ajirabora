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

    const { 
      userId, 
      jobId, 
      coverLetter, 
      matchScore, 
      matchReasons,
      includeCV = true  // New parameter
    } = req.body;

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

    const userData = userDoc.data();
    const jobData = jobDoc.data();

    // Prepare CV information
    let cvInfo = null;
    if (includeCV && userData.resumeUrl) {
      cvInfo = {
        url: userData.resumeUrl,
        fileName: userData.resumeFileName || 'resume.pdf',
        fileType: userData.resumeFileType || 'pdf',
        included: true
      };
    }

    // Create application with CV
    const application = {
      userId,
      jobId,
      coverLetter,
      matchScore: matchScore || 0,
      matchReasons: matchReasons || [],
      status: 'pending',
      // Applicant info
      applicantName: userData.fullName || userData.name || 'Unknown',
      applicantEmail: userData.email,
      applicantPhone: userData.phone || '',
      applicantLocation: userData.location || '',
      applicantSkills: userData.skills || [],
      applicantExperience: userData.experience || '',
      applicantEducation: userData.education || '',
      // CV info
      cvIncluded: includeCV && !!userData.resumeUrl,
      cvUrl: cvInfo?.url || null,
      cvFileName: cvInfo?.fileName || null,
      // Job info
      jobTitle: jobData.title,
      companyName: jobData.company,
      companyId: jobData.companyId || null,
      // Timestamps
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('applications').add(application);

    // Optional: Send email notification to employer with CV link
    // await sendEmailNotification(application);

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully with CV!',
      applicationId: result.id,
      cvIncluded: application.cvIncluded
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}