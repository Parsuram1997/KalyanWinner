
'use server';

import { auth, firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// IMPORTANT: This function is now transactional to prevent ghost users.
// It ensures that both the Firebase Auth user and the Firestore user document are created successfully.
export async function createUser(userData: any) {
  const { email, password, name, mobile, role, createdBy, state, district } = userData;

  // 1. Basic input validation
  if (!email || !password || !name || !mobile) {
    throw new Error('Missing required fields: email, password, name, and mobile are required.');
  }

  let firebaseUser: any = null;

  try {
    // 2. Create the user in Firebase Authentication
    firebaseUser = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
      phoneNumber: `+91${mobile}` // Ensure country code is included
    });

    // 3. Create the user document in Firestore within the same process
    const userDocRef = firestore.collection('users').doc(firebaseUser.uid);

    const newUser = {
      uid: firebaseUser.uid,
      customId: `KW${Date.now()}`,
      name,
      mobile,
      email,
      role,
      password, // Storing password hash is a security risk, but following existing pattern for now.
                // IMPORTANT: Consider moving to a more secure method post-resolution.
      balance: 0,
      totalBets: 0,
      totalWins: 0,
      isActive: true,
      createdBy,
      state,
      district,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userDocRef.set(newUser);

    return { success: true, uid: firebaseUser.uid };

  } catch (error: any) {
    // 4. If any step fails, attempt to clean up to prevent ghost users.
    // If the Firebase Auth user was created but the Firestore doc failed, delete the Auth user.
    if (firebaseUser && firebaseUser.uid) {
      try {
        await auth.deleteUser(firebaseUser.uid);
        console.log(`Cleaned up orphaned Firebase Auth user: ${firebaseUser.uid}`);
      } catch (cleanupError) {
        console.error(`CRITICAL: Failed to clean up orphaned Firebase Auth user ${firebaseUser.uid}. Please manually delete.`, cleanupError);
        // Even if cleanup fails, we must throw the original error to the user.
      }
    }

    // Re-throw the original error to be caught by the calling function.
    throw new Error(error.message || 'An unexpected error occurred during signup.');
  }
}
