
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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of the day for comparison
    const resultDate = new Date(resultData.date);

    // Adjust for timezone differences by getting the date parts in UTC
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const resultDateUTC = new Date(Date.UTC(resultDate.getUTCFullYear(), resultDate.getUTCMonth(), resultDate.getUTCDate()));

    if (resultDateUTC > todayUTC) {
      throw new Error("Cannot create results for a future date.");
    }
    
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

    
