import admin from 'firebase-admin';

let db;
let auth;

try {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin initialized');
  }
  
  db = admin.firestore();
  auth = admin.auth();
} catch (error) {
  console.error('Firebase Admin error:', error.message);
}

export { db, auth };
export default admin;