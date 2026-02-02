
import { NextResponse } from 'next/server';
import { firestore as db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(5).get(); // Get first 5 users for debugging

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No users found.' }, { status: 404 });
    }

    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(users);

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
