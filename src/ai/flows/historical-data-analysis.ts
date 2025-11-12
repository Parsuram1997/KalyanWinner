// HistoricalDataAnalysis flow provides insights into matka game trends.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview Analyzes historical Kalyan Matka results, providing insights into trends and patterns.
 *
 * - analyzeHistoricalData - A function that handles the analysis of historical Kalyan Matka data.
 * - HistoricalDataAnalysisInput - The input type for the analyzeHistoricalData function.
 * - HistoricalDataAnalysisOutput - The return type for the analyzeHistoricalData function.
 */

const HistoricalDataAnalysisInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical Kalyan Matka results data.  Include dates and corresponding winning numbers.'
    ),
  userQuery: z
    .string()
    .describe(
      'Specific questions or areas of focus for the analysis, such as trend identification or pattern recognition.'
    ),
});
export type HistoricalDataAnalysisInput = z.infer<
  typeof HistoricalDataAnalysisInputSchema
>;

const HistoricalDataAnalysisOutputSchema = z.object({
  analysisResult: z
    .string()
    .describe(
      'Detailed analysis of the historical data, including identified trends, patterns, and potential insights relevant to the user query.'
    ),
});
export type HistoricalDataAnalysisOutput = z.infer<
  typeof HistoricalDataAnalysisOutputSchema
>;

export async function analyzeHistoricalData(
  input: HistoricalDataAnalysisInput
): Promise<HistoricalDataAnalysisOutput> {
  return historicalDataAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'historicalDataAnalysisPrompt',
  input: {schema: HistoricalDataAnalysisInputSchema},
  output: {schema: HistoricalDataAnalysisOutputSchema},
  prompt: `You are an expert in analyzing historical data for the Kalyan Matka game. Your goal is to identify trends, patterns, and insights that can inform a user's betting strategy. Do not provide investment advice.  Just inform.

  Analyze the following historical data in the context of the user's query and provide a detailed analysis.

  Historical Data:
  {{historicalData}}

  User Query:
  {{userQuery}}
  `,
});

const historicalDataAnalysisFlow = ai.defineFlow(
  {
    name: 'historicalDataAnalysisFlow',
    inputSchema: HistoricalDataAnalysisInputSchema,
    outputSchema: HistoricalDataAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
