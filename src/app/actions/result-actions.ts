
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createKalyanResult(resultData: {
  date: string;
  marketName: string;
  openPanna: string;
  closePanna: string;
  jodi: string;
}) {
  try {
    await firestore.collection("kalyan_results").add(resultData);
    revalidatePath(`/admin/manage-results/${resultData.marketName.toLowerCase().replace(/\s+/g, '-')}`);
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
}, marketName: string) {
  try {
    await firestore.collection("kalyan_results").doc(resultId).update(resultData);
    revalidatePath(`/admin/manage-results/${marketName.toLowerCase().replace(/\s+/g, '-')}`);
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

    