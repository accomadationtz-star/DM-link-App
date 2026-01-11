export const mockProperties = Array.from({ length: 20 }, (_, i) => {
  const isApartment = i % 3 === 0;
  const isVilla = i % 3 === 1;
  const isStudio = i % 3 === 2;

  const category = isApartment ? 'Apartment' : isVilla ? 'Villa' : 'Studio';
  const location = isApartment
    ? 'Masaki Street, Kinondoni, Dar es Salaam'
    : isVilla
    ? 'Njiro Road, Arusha'
    : 'Area C, Dodoma';
  const price = isApartment
    ? '80,000 TSH/month'
    : isVilla
    ? '150,000 TSH/month'
    : '50,000 TSH/month';
  const rooms = isApartment ? 3 : isVilla ? 5 : 1;

  return {
    id: (i + 1).toString(),
    title: `${category} ${i + 1}`,
    category,
    location,
    price,
    rooms,
    images: [
      `https://picsum.photos/600/400?random=${i * 2 + 1}`,
      `https://picsum.photos/600/400?random=${i * 2 + 2}`,
      `https://picsum.photos/600/400?random=${i * 2 + 3}`,
    ],
    description:
      'A spacious and well-furnished property offering comfort and convenience in a prime location. Perfect for small families, professionals, or anyone looking for a peaceful living space.',
    agent: {
      name: ['John Deo', 'Jane Smith', 'Michael Adam'][i % 3],
      photo: `https://i.pravatar.cc/100?img=${i + 5}`,
    },
  };
});
