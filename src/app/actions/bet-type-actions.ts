
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createBetType(betTypeData: {
  name: string;
  description: string;
}) {
  try {
    await firestore.collection("bet_types").add({
      ...betTypeData,
      status: "Active", // Default status
    });
    revalidatePath("/admin/manage-bets");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating bet type:", error);
    throw new Error(error.message || "Failed to create bet type.");
  }
}

export async function updateBetType(betTypeId: string, betTypeData: {
  name?: string;
  description?: string;
  status?: "Active" | "Inactive";
}) {
  try {
    await firestore.collection("bet_types").doc(betTypeId).update(betTypeData);
    revalidatePath("/admin/manage-bets");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating bet type:", error);
    throw new Error(error.message || "Failed to update bet type.");
  }
}

export async function deleteBetType(betTypeId: string) {
    try {
        await firestore.collection("bet_types").doc(betTypeId).delete();
        revalidatePath("/admin/manage-bets");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting bet type:", error);
        throw new Error(error.message || "Failed to delete bet type.");
    }
}
