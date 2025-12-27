
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

// Helper function to convert a string to title case
const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export async function createMarket(marketData: {
  name: string;
  active: boolean;
}) {
  try {
    const standardizedMarketData = {
      ...marketData,
      name: toTitleCase(marketData.name),
    };
    await firestore.collection("markets").add(standardizedMarketData);
    revalidatePath("/admin/manage-markets");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating market:", error);
    throw new Error(error.message || "Failed to create market.");
  }
}

export async function updateMarket(marketId: string, marketData: {
  name?: string;
  active?: boolean;
}) {
  try {
    let standardizedMarketData: { [key: string]: any } = { ...marketData };
    if (marketData.name) {
      standardizedMarketData.name = toTitleCase(marketData.name);
    }
    await firestore.collection("markets").doc(marketId).update(standardizedMarketData);
    revalidatePath("/admin/manage-markets");
    revalidatePath("/admin/manage-timings"); // Revalidate timings page as well
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
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting market:", error);
        throw new Error(error.message || "Failed to delete market.");
    }
}
