
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createKalyanResult(resultData: {
  date: string;
  marketName: string;
  openPanna: string;
  closePanna?: string;
  jodi?: string;
}, marketSlug: string) {
  try {
    const resultsRef = firestore.collection("kalyan_results");

    await firestore.runTransaction(async (transaction) => {
      const query = resultsRef
        .where("marketName", "==", resultData.marketName)
        .where("date", "==", resultData.date);

      const snapshot = await transaction.get(query);

      if (!snapshot.empty) {
        throw new Error(`A result for ${resultData.marketName} on ${resultData.date} already exists.`);
      }
      
      const newResultRef = resultsRef.doc();
      transaction.set(newResultRef, resultData);
    });

    revalidatePath(`/admin/manage-results/${marketSlug}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error creating kalyan result:", error);
    throw new Error(error.message || "Failed to create kalyan result.");
  }
}


export async function updateKalyanResult(resultId: string, resultData: {
  date?: string;
  openPanna?: string;
  closePanna?: string;
  jodi?: string;
}, marketSlug: string) {
  try {
    await firestore.collection("kalyan_results").doc(resultId).update(resultData);
    revalidatePath(`/admin/manage-results/${marketSlug}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating kalyan result:", error);
    throw new Error(error.message || "Failed to update kalyan result.");
  }
}

export async function deleteKalyanResult(resultId: string) {
    try {
        await firestore.collection("kalyan_results").doc(resultId).delete();
        revalidatePath("/admin/manage-results");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting kalyan result:", error);
        throw new Error(error.message || "Failed to delete kalyan result.");
    }
}

    