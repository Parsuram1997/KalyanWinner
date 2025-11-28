
'use server';

import { firestore } from "@/lib/firebase-admin";

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
