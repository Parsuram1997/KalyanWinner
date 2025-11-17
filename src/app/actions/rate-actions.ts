
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function updateGameRate(rateId: string, rateData: {
  name?: string;
  rate?: string;
}) {
  try {
    await firestore.collection("game_rates").doc(rateId).update(rateData);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating game rate:", error);
    throw new Error(error.message || "Failed to update game rate.");
  }
}
