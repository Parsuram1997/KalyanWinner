
"use server";

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

// This interface is slightly different from the one in the component, but it's what the action receives.
interface KalyanResultPayload {
  date: string;
  marketName: string;
  openPanna: string;
  closePanna?: string;
  jodi?: string;
}

/**
 * Creates a new Kalyan result document in Firestore.
 * It checks for duplicates for the same market and date.
 *
 * @param resultData The data for the new result.
 * @returns An object indicating success or failure.
 */
export async function createKalyanResult(resultData: KalyanResultPayload) {
  try {
    const resultsRef = firestore.collection('kalyan_results');

    // Prevent duplicate results for the same market and date
    const existingResultQuery = await resultsRef
      .where('marketName', '==', resultData.marketName)
      .where('date', '==', resultData.date)
      .limit(1)
      .get();

    if (!existingResultQuery.empty) {
      throw new Error(`A result for ${resultData.marketName} on ${resultData.date} already exists.`);
    }

    // Add the new result document to Firestore
    await resultsRef.add(resultData);

    // Revalidate paths to refresh data on client-side navigations
    revalidatePath("/admin/manage-results", 'page');
    revalidatePath(`/admin/manage-results/${resultData.marketName.toLowerCase().replace(/\s+/g, '-')}`, 'page');
    revalidatePath("/play", 'page');
    revalidatePath("/results", 'page'); // also revalidate user-facing results pages

    return { success: true, message: 'Result saved successfully.' };
  } catch (error: any) {
    console.error("Error creating kalyan result:", error);
    // Re-throw the error so the client form can catch it and display a toast
    throw new Error(error.message || "Failed to create kalyan result.");
  }
}

/**
 * Updates an existing Kalyan result, typically to add the close panna and jodi.
 *
 * @param resultId The ID of the document to update.
 * @param resultData The partial data to update the document with.
 * @returns An object indicating success or failure.
 */
export async function updateKalyanResult(resultId: string, resultData: Partial<KalyanResultPayload>) {
  try {
    const resultRef = firestore.collection('kalyan_results').doc(resultId);

    // Update the document with the new data
    await resultRef.update(resultData);

    const doc = await resultRef.get();
    const marketName = doc.data()?.marketName || '';

    // Revalidate paths
    revalidatePath("/admin/manage-results", 'page');
    if (marketName) {
      revalidatePath(`/admin/manage-results/${marketName.toLowerCase().replace(/\s+/g, '-')}`, 'page');
    }
    revalidatePath("/play", 'page');
    revalidatePath("/results", 'page'); // also revalidate user-facing results pages

    return { success: true, message: 'Result updated successfully.' };
  } catch (error: any) {
    console.error("Error updating kalyan result:", error);
    throw new Error(error.message || "Failed to update kalyan result.");
  }
}

/**
 * Deletes a Kalyan result from Firestore.
 *
 * @param resultId The ID of the document to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteKalyanResult(resultId: string) {
  try {
    const resultRef = firestore.collection('kalyan_results').doc(resultId);

    const doc = await resultRef.get();
    if (!doc.exists) {
      throw new Error("Result not found.");
    }
    const marketName = doc.data()?.marketName || '';

    await resultRef.delete();

    // Revalidate relevant paths
    revalidatePath('/admin/manage-results', 'page');
    if (marketName) {
      revalidatePath(`/admin/manage-results/${marketName.toLowerCase().replace(/\s+/g, '-')}`, 'page');
    }

    return { success: true, message: "Result deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting kalyan result:", error);
    throw new Error(error.message || "Failed to delete kalyan result.");
  }
}
