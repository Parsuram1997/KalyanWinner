
import { ai } from '@/ai/genkit';
import { auth as adminAuth } from '@/lib/firebase-admin';
import * as z from 'zod';

export const setAdminClaimFlow = ai.defineFlow(
  {
    name: 'setAdminClaim',
    inputSchema: z.object({
      uid: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  async ({ uid }) => {
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    return { success: true };
  }
);
