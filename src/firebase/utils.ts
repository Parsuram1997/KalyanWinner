
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '.';

/**
 * Saves or updates the user's FCM token in Firestore.
 * @param userId - The ID of the user.
 * @param token - The FCM token to save.
 */
export const saveFcmToken = async (userId: string, token: string): Promise<void> => {
  if (!userId || !token) {
    console.error('Missing userId or token for saveFcmToken.');
    return;
  }

  const firestore = useFirestore();
  if (!firestore) {
    console.error('Firestore not initialized.');
    return;
  }

  const userDocRef = doc(firestore, 'users', userId);

  try {
    await updateDoc(userDocRef, {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    // Optionally, re-throw or handle the error as needed
    throw new Error('Could not save notification token to the database.');
  }
};
