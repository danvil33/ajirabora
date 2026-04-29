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

  const { jobId, rankingResults, employerId } = req.body;

  if (!jobId || !rankingResults) {
    return res.status(400).json({ error: 'jobId and rankingResults required' });
  }

  try {
    await db.collection('rankings').doc(jobId).set({
      jobId,
      employerId: employerId || null,
      rankingResults,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ success: true, message: 'Ranking saved successfully' });
  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ error: error.message });
  }
}