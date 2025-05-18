'use server';
/**
 * @fileOverview Automatically categorize transactions based on the description entered by the user.
 *
 * - categorizeTransaction - A function that categorizes a transaction based on its description.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  description: z.string().describe('The description of the transaction.'),
});
export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  category: z.string().describe('The predicted category of the transaction.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});
export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(input: CategorizeTransactionInput): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {
    schema: z.object({
      description: z.string().describe('The description of the transaction.'),
    }),
  },
  output: {
    schema: z.object({
      category: z.string().describe('The predicted category of the transaction.'),
      confidence: z.number().describe('The confidence level of the categorization (0-1).'),
    }),
  },
  prompt: `You are a personal finance expert. Your job is to categorize transactions based on their description.

  Here are some example categories: Groceries, Transportation, Utilities, Entertainment, Income, Rent

  Please categorize the following transaction description:

  Description: {{{description}}}

  Return the category and a confidence level (0-1) for your categorization.
  `,
});

const categorizeTransactionFlow = ai.defineFlow<
  typeof CategorizeTransactionInputSchema,
  typeof CategorizeTransactionOutputSchema
>({
  name: 'categorizeTransactionFlow',
  inputSchema: CategorizeTransactionInputSchema,
  outputSchema: CategorizeTransactionOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
