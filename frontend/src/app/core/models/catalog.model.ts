export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface PieceRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrls?: string[];
  categoryIds?: string[];
}

export interface PieceSetRequest {
  name: string;
  description?: string;
  price: number;
  pieceIds: string[];
}

export interface PieceResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  inStock: boolean;
  imageUrls: string[];
  categories: CategoryResponse[];
  createdAt: string;
}

export interface PieceSetResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  availableStock: number;
  pieces: PieceResponse[];
  createdAt: string;
}
