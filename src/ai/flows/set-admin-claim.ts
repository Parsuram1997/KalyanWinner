
import { defineFlow, run } from '@genkit-ai/flow';
import { getAuth } from 'firebase-admin/auth';
import * as z from 'zod';

export const setAdminClaimFlow = defineFlow(
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
    await getAuth().setCustomUserClaims(uid, { admin: true });
    return { success: true };
  }
);
