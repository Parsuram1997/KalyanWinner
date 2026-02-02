
'use server';

import { auth, firestore } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function getEmailForMobile(mobile: string): Promise<{ email: string | null; error?: string }> {
  try {
    let numberToQuery = mobile.trim();

    // Normalize the mobile number to 10 digits
    if (numberToQuery.startsWith('+91')) {
      numberToQuery = numberToQuery.substring(3);
    } else if (numberToQuery.startsWith('91')) {
      numberToQuery = numberToQuery.substring(2);
    }

    if (!/^\d{10}$/.test(numberToQuery)) {
        return { email: null, error: 'Please enter a valid 10-digit mobile number.' };
    }
    
    const usersRef = firestore.collection("users");
    const q = usersRef.where("mobile", "==", numberToQuery).limit(1);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return { email: null, error: 'No account is associated with this mobile number.' };
    }

    const email = querySnapshot.docs[0].data().email;

    if (!email) {
      return { email: null, error: 'The associated account does not have an email address.' };
    }

    return { email: email };

  } catch (error) {
    console.error("Server error in getEmailForMobile:", error);
    return { email: null, error: 'An unexpected error occurred on the server.' }; 
  }
}


export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return null;
    }
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

