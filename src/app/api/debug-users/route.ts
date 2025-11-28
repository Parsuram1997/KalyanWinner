
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Check if the service account key is available as a string
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    // This will use the default service account when deployed on Google Cloud.
    initializeApp(); 
  }
}

const db = getFirestore();

export async function GET() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(5).get(); // Get first 5 users for debugging

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No users found.' }, { status: 404 });
    }

    const users: any[] = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ users });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
  }
}
