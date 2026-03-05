export interface AgentProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: 'available' | 'rented' | 'sold';
  image: string;
  dateAdded: string;
  views: number;
  inquiries: number;
}

export const mockAgentProperties: AgentProperty[] = [
  {
    id: '1',
    title: 'Modern Downtown Apartment',
    location: 'Downtown, New York',
    price: 450000,
    type: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
    dateAdded: '2024-01-15',
    views: 245,
    inquiries: 12,
  },
  {
    id: '2',
    title: 'Luxury Family House',
    location: 'Suburb, California',
    price: 850000,
    type: 'House',
    bedrooms: 4,
    bathrooms: 3,
    area: 2500,
    status: 'rented',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
    dateAdded: '2024-01-10',
    views: 189,
    inquiries: 8,
  },
  {
    id: '3',
    title: 'Commercial Office Space',
    location: 'Business District, Chicago',
    price: 1200000,
    type: 'Office',
    bedrooms: 0,
    bathrooms: 2,
    area: 3000,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    dateAdded: '2024-01-08',
    views: 156,
    inquiries: 5,
  },
  {
    id: '4',
    title: 'Cozy Studio Apartment',
    location: 'Midtown, Miami',
    price: 320000,
    type: 'Apartment',
    bedrooms: 1,
    bathrooms: 1,
    area: 800,
    status: 'sold',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    dateAdded: '2024-01-05',
    views: 312,
    inquiries: 18,
  },
  {
    id: '5',
    title: 'Spacious Family Home',
    location: 'Residential Area, Texas',
    price: 650000,
    type: 'House',
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    status: 'available',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
    dateAdded: '2024-01-12',
    views: 198,
    inquiries: 9,
  },
];

export const getPropertiesByStatus = (status: 'available' | 'rented' | 'sold') => {
  return mockAgentProperties.filter(property => property.status === status);
};

export const getTotalStats = () => {
  const total = mockAgentProperties.length;
  const available = getPropertiesByStatus('available').length;
  const rented = getPropertiesByStatus('rented').length;
  const sold = getPropertiesByStatus('sold').length;
  const totalViews = mockAgentProperties.reduce((sum, prop) => sum + prop.views, 0);
  const totalInquiries = mockAgentProperties.reduce((sum, prop) => sum + prop.inquiries, 0);

  return {
    total,
    available,
    rented,
    sold,
    totalViews,
    totalInquiries,
  };
};
