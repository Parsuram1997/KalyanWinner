'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function updateBet(betId: string, data: { number?: string; amount?: number }) {
  try {
    const betRef = firestore.collection("kalyan_bets").doc(betId);
    await betRef.update(data);
    revalidatePath("/admin/bet-ledger", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating bet:", error);
    throw new Error(error.message || "Failed to update bet.");
  }
}

export async function deleteBet(betId: string) {
  try {
    const betRef = firestore.collection("kalyan_bets").doc(betId);
    await betRef.delete();
    revalidatePath("/admin/bet-ledger", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bet:", error);
    throw new Error(error.message || "Failed to delete bet.");
  }
}

export async function deleteMultipleBets(betIds: string[]) {
  if (!betIds || betIds.length === 0) {
    throw new Error("No bet IDs provided for deletion.");
  }
  try {
    const batch = firestore.batch();
    betIds.forEach(id => {
      const betRef = firestore.collection("kalyan_bets").doc(id);
      batch.delete(betRef);
    });
    await batch.commit();
    revalidatePath("/admin/bet-ledger", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting multiple bets:", error);
    throw new Error(error.message || "Failed to delete bets.");
  }
}
