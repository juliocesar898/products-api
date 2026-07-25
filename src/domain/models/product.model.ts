export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategories: string[];
  location: string;
  price: number;
  popularity: number;
  createdAt: Date;
}