
'use client';

import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import SpendingReport from '@/components/SpendingReport';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { getTransactions, addTransaction as dbAddTransaction, deleteTransaction as dbDeleteTransaction } from "@/lib/actions";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!currentUser) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getTransactions();
      if (Array.isArray(data)) {
        // Фільтруємо транзакції для поточного користувача
        const userTransactions = data.filter(t => t.userEmail === currentUser.email);
        setTransactions(userTransactions.map(t => ({ ...t, amount: Number(t.amount), date: new Date(t.date) })));
      } else {
        console.error("getTransactions did not return an array:", data);
        setTransactions([]);
         toast({
            title: "Помилка формату даних!",
            description: "Не вдалося обробити дані транзакцій.",
            variant: "destructive",
          });
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({
          title: "Помилка завантаження!",
          description: "Не вдалося завантажити транзакції.",
          variant: "destructive",
        });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    } else if (!authLoading) { 
      setTransactions([]);
      setLoading(false);
    }
  }, [currentUser, authLoading, fetchTransactions]);


  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'userEmail'>) => {
    if (!currentUser || !currentUser.email) {
      toast({ title: "Помилка", description: "Будь ласка, увійдіть, щоб додати транзакцію.", variant: "destructive" });
      return;
    }
     const dataToSend = {
       ...transactionData,
       date: transactionData.date.toISOString(),
       amount: Number(transactionData.amount),
       userEmail: currentUser.email, 
     };

    const result = await dbAddTransaction(dataToSend as any); 

    if (result && 'id' in result) {
      const newTransaction: Transaction = {
          ...result,
          date: new Date(result.date),
          amount: Number(result.amount),
          userEmail: result.userEmail,
      };
      setTransactions(prevTransactions => [...prevTransactions, newTransaction].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({
          title: "Успіх!",
          description: "Вашу транзакцію записано.",
        });
    } else if (result && 'error' in result) {
      console.error("Failed to add transaction:", result.error);
       toast({
            title: "Помилка!",
            description: `Не вдалося додати транзакцію: ${result.error}`,
            variant: "destructive",
          });
    } else {
         console.error("Unexpected result format from addTransaction:", result);
         toast({
            title: "Помилка!",
            description: "Не вдалося додати транзакцію: Невідома помилка.",
            variant: "destructive",
          });
    }
  };

   const handleDeleteTransaction = async (id: string | number) => {
     if (!currentUser || !currentUser.email) {
       toast({ title: "Помилка", description: "Будь ласка, увійдіть, щоб видалити транзакцію.", variant: "destructive" });
       return;
     }
     const numericId = Number(id);
     if (isNaN(numericId)) {
        toast({
            title: "Помилка!",
            description: "Неправильний ID транзакції.",
            variant: "destructive",
        });
        return;
     }
     try {
      // Передаємо email користувача до функції видалення
      const result = await dbDeleteTransaction(numericId, currentUser.email);
      if (result && result.success) {
        setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== numericId));
        toast({
            title: "Успіх!",
            description: "Транзакцію видалено.",
          });
      } else if (result && result.error) {
        toast({
            title: "Помилка!",
            description: result.error || "Не вдалося видалити транзакцію.",
            variant: "destructive",
          });
      } else {
        toast({
            title: "Помилка!",
            description: "Не вдалося видалити транзакцію: Невідома помилка.",
            variant: "destructive",
          });
      }
    } catch (error) {
        toast({
            title: "Помилка!",
            description: "Сталася помилка під час видалення.",
            variant: "destructive",
          });
      console.error("Error deleting transaction:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Ви вийшли', description: 'До зустрічі!' });
      router.push('/login');
    } catch (error: any) {
      toast({ title: 'Помилка виходу', description: error.message, variant: 'destructive' });
    }
  };

  const calculateBalance = () => {
    if (!Array.isArray(transactions)) {
        return 0;
    }
    return transactions.reduce((balance, transaction) => balance + Number(transaction.amount), 0);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-muted-foreground">Завантаження...</p>
      </div>
    );
  }

  const balance = calculateBalance();
  const incomeTransactions = transactions.filter(t => Number(t.amount) > 0);
  const expenseTransactions = transactions.filter(t => Number(t.amount) < 0);


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
           <Image src="/logo.png" alt="PennyWise Logo" width={48} height={48} className="mr-3 rounded-full shadow-md" data-ai-hint="piggy bank" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">PennyWise</h1>
        </div>
        <p className="text-muted-foreground">Ваш персональний фінансовий помічник</p>
         {currentUser && (
          <div className="mt-4 flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">Вітаємо, {currentUser.email}</p>
            <div className="flex space-x-2">
                <Link href="/change-password" passHref>
                    <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Змінити пароль
                    </Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="text-primary" size="sm">Вийти</Button>
            </div>
          </div>
        )}
      </header>

      {!currentUser ? (
        <Card className="text-center p-8 shadow-xl border-accent">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl mb-2 text-accent-foreground">Ласкаво просимо до PennyWise!</CardTitle>
             <CardDescription className="mb-6 text-lg">
              Будь ласка, увійдіть або зареєструйтеся, щоб почати керувати своїми фінансами.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4">
              <Link href="/login" passHref>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">Увійти</Button>
              </Link>
              <Link href="/signup" passHref>
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">Зареєструватися</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-8 shadow-xl border-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-2xl font-semibold text-accent-foreground">Поточний баланс</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className={`text-5xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                 ₴{balance.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-xl">Додати транзакцію</CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionForm onTransactionAdded={handleAddTransaction} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Витрати</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-muted-foreground">Завантаження витрат...</p>
                  ) : (
                    <TransactionList
                      transactions={expenseTransactions}
                      type="expenses"
                      onTransactionDeleted={handleDeleteTransaction}
                     />
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Доходи</CardTitle>
                </CardHeader>
                <CardContent>
                   {loading ? (
                    <p className="text-muted-foreground">Завантаження доходів...</p>
                  ) : (
                    <TransactionList
                       transactions={incomeTransactions}
                       type="income"
                       onTransactionDeleted={handleDeleteTransaction}
                     />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Звіт про витрати</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                    <p className="text-muted-foreground">Завантаження звіту...</p>
                ) : (
                  <SpendingReport transactions={expenseTransactions} />
                 )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
       <Toaster />
    </div>
  );
}
