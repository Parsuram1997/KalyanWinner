
'use server';

import { firestore } from "@/lib/firebase-admin";

// A new, more powerful function that creates a rate if it doesn't exist or updates it if it does.
export async function upsertGameRate(rateData: { name: string; betAmount: number; payoutAmount: number }) {
  try {
    const ratesRef = firestore.collection("game_rates");
    const querySnapshot = await ratesRef.where('name', '==', rateData.name).limit(1).get();

    if (!querySnapshot.empty) {
      // Rate exists, so we update it.
      const existingDoc = querySnapshot.docs[0];
      await existingDoc.ref.update(rateData);
      return { success: true, action: 'updated' };
    } else {
      // Rate does not exist, so we create it.
      await ratesRef.add(rateData);
      return { success: true, action: 'created' };
    }
  } catch (error: any) {
    console.error("Error upserting game rate:", error);
    throw new Error(error.message || "Failed to upsert game rate.");
  }
}

export async function createGameRate(rateData: { name: string; betAmount: number; payoutAmount: number }) {
  try {
    await firestore.collection("game_rates").add(rateData);
    return { success: true };
  } catch (error: any) {
    console.error("Error creating game rate:", error);
    throw new Error(error.message || "Failed to create game rate.");
  }
}

export async function updateGameRate(rateId: string, rateData: {
  betAmount?: number;
  payoutAmount?: number;
}) {
  try {
    await firestore.collection("game_rates").doc(rateId).update(rateData);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating game rate:", error);
    throw new Error(error.message || "Failed to update game rate.");
  }
}

export async function deleteGameRate(rateId: string) {
    try {
        await firestore.collection("game_rates").doc(rateId).delete();
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting game rate:", error);
        throw new Error(error.message || "Failed to delete game rate.");
    }
}
