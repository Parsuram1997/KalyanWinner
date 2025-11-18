
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createKalyanResult(resultData: {
  date: string;
  marketName: string;
  openPanna: string;
  closePanna: string;
  jodi: string;
}, marketSlug: string) {
  try {
    const resultsRef = firestore.collection("kalyan_results");

    // Use a transaction to ensure atomicity
    await firestore.runTransaction(async (transaction) => {
      const query = resultsRef
        .where("marketName", "==", resultData.marketName)
        .where("date", "==", resultData.date);

      const snapshot = await transaction.get(query);

      if (!snapshot.empty) {
        throw new Error(`A result for ${resultData.marketName} on ${resultData.date} already exists.`);
      }

      // If no documents are found, create the new result
      const newResultRef = resultsRef.doc();
      transaction.set(newResultRef, resultData);
    });

    revalidatePath(`/admin/manage-results/${marketSlug}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error creating kalyan result:", error);
    // Re-throw the specific error message to be caught by the client
    throw new Error(error.message || "Failed to create kalyan result.");
  }
}


export async function updateKalyanResult(resultId: string, resultData: {
  date?: string;
  openPanna?: string;
  closePanna?: string;
  jodi?: string;
}, marketSlug: string) { // Changed marketName to marketSlug for clarity
  try {
    await firestore.collection("kalyan_results").doc(resultId).update(resultData);
    // Use the passed slug directly for revalidation
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
        // Since we don't know the market from just the ID, we might need a broader revalidation
        // or handle it on the client-side optimistically.
        // For now, let's revalidate the main results page.
        revalidatePath("/admin/manage-results");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting kalyan result:", error);
        throw new Error(error.message || "Failed to delete kalyan result.");
    }
}

    
