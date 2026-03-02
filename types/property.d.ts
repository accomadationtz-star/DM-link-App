// services/api/property/types.ts
export type MediaItem = {
  url: string;
  public_id: string;
  type: "image" | "video";
};

export type PropertyLocation = {
  region: string;
  district: string;
  street: string;
};

export type OwnerInfo = {
  _id: string;
  email: string;
  phoneNumber: string;
  username?: string;
};

export type Property = {
  _id: string;
  title: string;
  description: string;
  type: string;
  purpose: string;
  price: number;
  bedrooms: number;
  area: number;
  location: PropertyLocation;
  cover?: {
    url: string;
    public_id: string;
  };
  media: MediaItem[];
  status: string;
  createdAt: string;
  updatedAt?: string;
  ownerId?: OwnerInfo;
  ownerUsername?: string;
  views?: number;
  inquiries?: any[];
  bookings?: any[];
};
