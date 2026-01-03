export interface Product {
  name: string;
  price: number;
  imageUrl: string;
  itemUrl: string;
  description?: string;
  shopName?: string;
}

export interface ProductSearchParams {
  keyword: string;
  maxPrice?: number;
  page?: number;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
}
