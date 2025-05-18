
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { categorizeTransaction } from "@/ai/flows/categorize-transaction";
import type { Transaction } from '@/lib/types';


// Define schema with refined validation messages and types
const transactionSchema = z.object({
  amount: z.coerce.number({
    required_error: "Будь ласка, введіть суму.",
    invalid_type_error: "Сума має бути числом.",
  }).positive({ message: "Сума має бути більшою за 0." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Будь ласка, введіть дійсну дату.",
  }),
  category: z.string({ required_error: "Будь ласка, виберіть категорію." }).min(1, { message: "Будь ласка, виберіть категорію." }),
  description: z.string({ required_error: "Будь ласка, введіть опис." }).min(3, {
    message: "Опис має містити не менше 3 символів.",
  }).max(100, { message: "Опис не може перевищувати 100 символів." }),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const categories = [
  "Дохід",
  "Продукти",
  "Транспорт",
  "Комунальні послуги",
  "Розваги",
  "Оренда",
  "Здоров'я",
  "Одяг",
  "Інше",
];

interface TransactionFormProps {
  // Тепер очікуємо Omit<Transaction, 'id' | 'userEmail'>
  onTransactionAdded: (transaction: Omit<Transaction, 'id' | 'userEmail'>) => Promise<void>;
}

const TransactionForm = ({ onTransactionAdded }: TransactionFormProps) => {
  const [aiCategory, setAiCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '' as unknown as number,
      date: new Date().toISOString().split('T')[0],
      category: "",
      description: "",
    },
  });

   const onSubmit = async (values: TransactionFormValues) => {
       setIsSubmitting(true);

      const finalAmount = values.category === 'Дохід'
          ? Math.abs(values.amount)
          : -Math.abs(values.amount);

      // Готуємо дані без userEmail, оскільки він буде доданий у page.tsx
      const newTransactionData: Omit<Transaction, 'id' | 'userEmail'> = {
          date: new Date(values.date),
          amount: finalAmount,
          category: values.category,
          description: values.description.trim(),
      };

       try {
          await onTransactionAdded(newTransactionData);
          form.reset();
          setAiCategory(null);
       } catch (error) {
           console.error("Error during transaction submission:", error);
       } finally {
           setIsSubmitting(false);
       }
   };


  let debounceTimeout: NodeJS.Timeout | null = null;
  const handleDescriptionChange = (description: string) => {
    form.setValue('description', description);

    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }

    if (description.length > 3) {
      debounceTimeout = setTimeout(async () => {
          try {
            const categorization = await categorizeTransaction({ description });
            if (categorization.confidence > 0.6 && categories.includes(categorization.category)) {
              if (form.getValues('category') !== categorization.category) {
                 setAiCategory(categorization.category);
              } else {
                  setAiCategory(null);
              }
            } else {
              setAiCategory(null);
            }
          } catch (error: any) {
            console.error("AI Categorization Error:", error.message);
            setAiCategory(null);
          }
      }, 500);
    } else {
      setAiCategory(null);
    }
  };

  const applySuggestedCategory = () => {
    if (aiCategory) {
      form.setValue('category', aiCategory, { shouldValidate: true });
      setAiCategory(null);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сума (₴)</FormLabel>
              <FormControl>
                <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                 />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Категорія</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Виберіть категорію" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {aiCategory && field.value !== aiCategory && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                    <Label className="text-muted-foreground">Пропозиція AI:</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applySuggestedCategory}
                        className="h-auto px-2 py-1"
                    >
                        {aiCategory}
                    </Button>
                </div>
                )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Опис</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Наприклад, кава з друзями"
                  {...field}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                 />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : 'Записати транзакцію'}
        </Button>
      </form>
    </Form>
  );
};

export default TransactionForm;
