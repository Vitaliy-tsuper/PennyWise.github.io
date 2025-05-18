
export interface Transaction {
  id: number;
  date: Date;
  amount: number;
  category: string;
  description: string;
  userEmail: string; // Додано поле для email користувача
}
