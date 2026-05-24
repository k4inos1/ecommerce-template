import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import productsData from './products.json';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  badge?: string;
}

/**
 * Fetches all food products from Firebase Firestore.
 * Falls back to local JSON data if Firestore is unavailable (e.g., placeholder credentials).
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    if (querySnapshot.empty) {
      // Fall back to local data if the collection is empty
      return productsData.map(p => ({ ...p, id: String(p.id) }));
    }
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Product[];
  } catch {
    // Fall back to local data when Firebase is not yet configured
    return productsData.map(p => ({ ...p, id: String(p.id) }));
  }
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'products'), product);
  return docRef.id;
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id'>>): Promise<void> {
  await updateDoc(doc(db, 'products', id), product);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}
