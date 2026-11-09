export interface AddressResponse {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

export interface AddressRequest {
  label: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface CustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  addresses: AddressResponse[];
  createdAt: string;
}
