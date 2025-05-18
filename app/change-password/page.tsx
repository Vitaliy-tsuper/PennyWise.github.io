
// src/app/change-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

export default function ChangePasswordPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
      if (!user && !loading) { // Ensure loading is false before redirecting
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, loading]); // Added loading to dependency array

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-muted-foreground">Завантаження...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback, we can show a message or null.
    // For now, redirecting if still not caught by useEffect (e.g., race condition)
     if (typeof window !== 'undefined') router.push('/login');
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-xl text-muted-foreground">Будь ласка, увійдіть, щоб змінити пароль.</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            На головну
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Змінити пароль</CardTitle>
          <CardDescription>Введіть ваш поточний та новий пароль.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
