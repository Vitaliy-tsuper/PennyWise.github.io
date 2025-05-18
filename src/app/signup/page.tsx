
// src/app/signup/page.tsx
'use client';

import SignupForm from '@/components/SignupForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
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
          <CardTitle className="text-2xl font-bold text-primary">Створити акаунт</CardTitle>
          <CardDescription>Заповніть форму нижче, щоб зареєструватися.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Вже маєте акаунт?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Увійти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
