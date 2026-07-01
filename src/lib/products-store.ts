import fs from 'fs';
import path from 'path';

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  specifications: Record<string, string>;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'products.json');

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllProducts(): Product[] {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as Product[];
}

export function getProductById(id: string): Product | null {
  const products = getAllProducts();
  return products.find((p) => p.id === id) || null;
}

export function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const products = getAllProducts();

  const product: Product = {
    ...data,
    id: generateId(),
    slug: data.slug || slugify(data.name),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(product);
  saveProducts(products);
  return product;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const products = getAllProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  products[index] = {
    ...products[index],
    ...data,
    id: products[index].id, // never overwrite id
    createdAt: products[index].createdAt, // never overwrite createdAt
    updatedAt: new Date().toISOString(),
  };

  saveProducts(products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getAllProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  saveProducts(products);
  return true;
}

export function getProductStats() {
  const products = getAllProducts();
  const active = products.filter((p) => p.isActive);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const featured = products.filter((p) => p.isFeatured).length;
  const categories = [...new Set(products.map((p) => p.category))];
  const brands = [...new Set(products.map((p) => p.brand))];

  return {
    total: products.length,
    active: active.length,
    totalStock,
    totalValue,
    outOfStock,
    featured,
    categoriesCount: categories.length,
    brandsCount: brands.length,
    categories,
    brands,
  };
}

// --- Helpers ---

function saveProducts(products: Product[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
