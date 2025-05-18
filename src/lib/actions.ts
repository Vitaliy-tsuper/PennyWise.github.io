
'use server';

import type { Transaction } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// In-memory store for transactions
let transactions: Transaction[] = [
  // Sample data to make the app usable without a DB
  { id: 1, date: new Date('2024-07-15T10:00:00.000Z'), amount: -50, category: 'Продукти', description: 'Молоко та хліб', userEmail: 'test@example.com' },
  { id: 2, date: new Date('2024-07-15T12:30:00.000Z'), amount: 1200, category: 'Дохід', description: 'Зарплата', userEmail: 'test@example.com' },
  { id: 3, date: new Date('2024-07-16T18:00:00.000Z'), amount: -250, category: 'Розваги', description: 'Квитки в кіно', userEmail: 'another@example.com' },
];
let nextId = 4; // Next ID for new transactions

export async function getTransactions(): Promise<Transaction[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  // Return a deep copy of transactions with dates as Date objects
  return JSON.parse(JSON.stringify(transactions.map(t => ({ ...t, date: t.date.toISOString() })))).map((t: any) => ({...t, date: new Date(t.date)}));
}

interface AddTransactionInput {
    date: string;
    amount: number;
    category: string;
    description: string;
    userEmail: string; 
}

export async function addTransaction(transactionData: AddTransactionInput): Promise<Transaction | { error: string }> {
  try {
    if (typeof transactionData.amount !== 'number' || isNaN(transactionData.amount)) {
        return { error: "Invalid amount provided." };
    }
     if (!transactionData.date || isNaN(new Date(transactionData.date).getTime())) {
        return { error: "Invalid date provided." };
    }
     if (!transactionData.category) {
        return { error: "Category is required." };
     }
      if (!transactionData.description) {
        return { error: "Description is required." };
     }
     if (!transactionData.userEmail) {
        return { error: "User email is required."}
     }


    const newTransaction: Transaction = {
      id: nextId++,
      date: new Date(transactionData.date),
      amount: transactionData.amount,
      category: transactionData.category,
      description: transactionData.description,
      userEmail: transactionData.userEmail, 
    };
    transactions.push(newTransaction);
    revalidatePath('/');
    const returnedTransaction = JSON.parse(JSON.stringify({...newTransaction, date: newTransaction.date.toISOString()}));
    return {...returnedTransaction, date: new Date(returnedTransaction.date)};
  } catch (error: any) {
    console.error("Error adding transaction (in-memory):", error);
    return { error: "Failed to add transaction (in-memory)." };
  }
}


export async function deleteTransaction(id: number, userEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof id !== 'number' || isNaN(id)) {
        return { success: false, error: "Invalid transaction ID." };
      }
      if (!userEmail) {
        return { success: false, error: "User email is required for deletion."};
      }

      const transactionIndex = transactions.findIndex(t => t.id === id);

      if (transactionIndex === -1) {
          return { success: false, error: "Transaction not found."};
      }

      if (transactions[transactionIndex].userEmail !== userEmail) {
          return { success: false, error: "You can only delete your own transactions."};
      }
      
      transactions.splice(transactionIndex, 1);

      revalidatePath('/');
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting transaction (in-memory):", error);
      return { success: false, error: "Failed to delete transaction (in-memory)." };
    }
  }
