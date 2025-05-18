
"use client";

import type { Transaction } from '@/lib/types';
import { useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Trash } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  type: 'income' | 'expenses';
  onTransactionDeleted: (id: number) => Promise<void>;
}

const TransactionList = ({ transactions, type, onTransactionDeleted }: TransactionListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  // Adjusted sortable keys to exclude userEmail. 'actions' is a placeholder for the actions column header if needed.
  const [sortConfig, setSortConfig] = useState<{ key: Exclude<keyof Transaction, 'userEmail'> | 'actions' | null; direction: "ascending" | "descending" }>({
    key: 'date',
    direction: "descending",
  });

  // Define sortable keys explicitly, excluding userEmail
  type SortableKeys = Exclude<keyof Transaction, 'userEmail'>;

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortConfig.key || sortConfig.key === 'actions') { // 'actions' column is not sortable data-wise
      return 0;
    }
    // Ensure that sortConfig.key is a valid key of Transaction after excluding userEmail
    const key = sortConfig.key as SortableKeys;

    let valA = a[key];
    let valB = b[key];

    if (key === 'date') {
      valA = new Date(valA instanceof Date ? valA : String(valA)).getTime();
      valB = new Date(valB instanceof Date ? valB : String(valB)).getTime();
    } else if (key === 'amount') {
      valA = Number(valA);
      valB = Number(valB);
    } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
    }

    const direction = sortConfig.direction === "ascending" ? 1 : -1;
    if (valA < valB) {
      return -1 * direction;
    }
    if (valA > valB) {
      return 1 * direction;
    }
    return 0;
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

   const handleDelete = async (id: number | string) => {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      console.error("Invalid ID for deletion:", id);
      return;
    }
    await onTransactionDeleted(numericId);
  };

  const filteredTransactions = sortedTransactions.filter((transaction) => {
    const searchTermLower = searchTerm.toLowerCase();
    const descriptionMatch = transaction.description?.toLowerCase().includes(searchTermLower) ?? false;
    const categoryMatch = transaction.category?.toLowerCase().includes(searchTermLower) ?? false;
    const dateMatch = transaction.date ? format(new Date(transaction.date), 'dd.MM.yyyy', { locale: uk }).includes(searchTermLower) : false;
    const amountMatch = transaction.amount?.toString().includes(searchTermLower) ?? false;
    // emailMatch has been removed from filtering logic

    return (
      descriptionMatch ||
      categoryMatch ||
      dateMatch ||
      amountMatch
    );
  });


  const requestSort = (key: SortableKeys | 'actions') => {
    if (key === 'actions') return; // 'actions' column header itself isn't sortable by data

    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKeys | 'actions') => {
    if (key === 'actions') return ""; // No indicator for non-sortable 'actions' header
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ▲" : " ▼";
    }
    return "";
  };

  const captionText = type === 'income' ? 'доходів' : 'витрат';

  return (
    <div>
      <Input
        type="text"
        placeholder={`Пошук ${captionText}...`}
        value={searchTerm}
        onChange={handleSearch}
        className="mb-4"
        aria-label={`Пошук ${captionText}`}
      />
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableCaption>Список ваших останніх {captionText}.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("date")} className="cursor-pointer whitespace-nowrap">
                Дата{getSortIndicator("date")}
              </TableHead>
              <TableHead onClick={() => requestSort("amount")} className="cursor-pointer text-right whitespace-nowrap">
                Сума{getSortIndicator("amount")}
              </TableHead>
              <TableHead onClick={() => requestSort("category")} className="cursor-pointer whitespace-nowrap">
                Категорія{getSortIndicator("category")}
              </TableHead>
              <TableHead className="whitespace-nowrap">Опис</TableHead>
              {/* Обліковий запис (userEmail) TableHead removed */}
              <TableHead className="text-right whitespace-nowrap">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                      {transaction.date ? format(new Date(transaction.date), 'dd.MM.yyyy', { locale: uk }) : 'N/A'}
                  </TableCell>
                   <TableCell className={`text-right whitespace-nowrap ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     {transaction.amount >= 0 ? '+' : ''}₴{transaction.amount?.toFixed(2) ?? '0.00'}
                   </TableCell>
                  <TableCell className="whitespace-nowrap">{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  {/* Обліковий запис (userEmail) TableCell removed */}
                  <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                        aria-label="Видалити транзакцію"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                {/* Updated colSpan to 5 (Date, Sum, Category, Description, Actions) */}
                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                  {`Немає ${captionText} для відображення.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionList;
