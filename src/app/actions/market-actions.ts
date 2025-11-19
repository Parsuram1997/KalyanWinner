
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createMarket(marketData: {
  name: string;
  openBiddingTime: string;
  openResultTime: string;
  closeBiddingTime: string;
  closeResultTime: string;
}) {
  try {
    await firestore.collection("markets").add({
      ...marketData,
      status: "Active", // Default status
    });
    revalidatePath("/admin/manage-markets");
    revalidatePath("/admin/manage-timings");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating market:", error);
    throw new Error(error.message || "Failed to create market.");
  }
}

export async function updateMarket(marketId: string, marketData: {
  name?: string;
  openBiddingTime?: string;
  openResultTime?: string;
  closeBiddingTime?: string;
  closeResultTime?: string;
  status?: "Active" | "Inactive";
}) {
  try {
    await firestore.collection("markets").doc(marketId).update(marketData);
    revalidatePath("/admin/manage-markets");
    revalidatePath("/admin/manage-timings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating market:", error);
    throw new Error(error.message || "Failed to update market.");
  }
}

export async function deleteMarket(marketId: string) {
    try {
        await firestore.collection("markets").doc(marketId).delete();
        revalidatePath("/admin/manage-markets");
        revalidatePath("/admin/manage-timings");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting market:", error);
        throw new Error(error.message || "Failed to delete market.");
    }
}

    