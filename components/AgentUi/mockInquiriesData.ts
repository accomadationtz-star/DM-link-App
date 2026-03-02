export interface Inquiry {
  id: string;
  propertyId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  propertyTitle: string;
  propertyPrice: number;
  message: string;
  status: "pending" | "contacted" | "booked" | "cancelled";
  createdAt: string;
}

export const mockInquiries: Inquiry[] = [
  {
    id: "1",
    propertyId: "1",
    clientId: "client1",
    clientName: "John Doe",
    clientPhone: "+255 654 321 098",
    propertyTitle: "Modern Downtown Apartment",
    propertyPrice: 450000,
    message: "Interested in this property. Can we schedule a viewing?",
    status: "pending",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    propertyId: "1",
    clientId: "client2",
    clientName: "Jane Smith",
    clientPhone: "+255 765 432 109",
    propertyTitle: "Modern Downtown Apartment",
    propertyPrice: 450000,
    message: "What is the financing option available?",
    status: "pending",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    propertyId: "5",
    clientId: "client3",
    clientName: "Michael Johnson",
    clientPhone: "+255 876 543 210",
    propertyTitle: "Spacious Family Home",
    propertyPrice: 650000,
    message: "Is this property still available?",
    status: "pending",
    createdAt: "2024-01-14T09:15:00Z",
  },
  {
    id: "4",
    propertyId: "3",
    clientId: "client4",
    clientName: "Sarah Williams",
    clientPhone: "+255 543 210 876",
    propertyTitle: "Commercial Office Space",
    propertyPrice: 1200000,
    message: "Interested in long-term lease",
    status: "contacted",
    createdAt: "2024-01-13T16:45:00Z",
  },
  {
    id: "5",
    propertyId: "5",
    clientId: "client5",
    clientName: "David Brown",
    clientPhone: "+255 432 109 876",
    propertyTitle: "Spacious Family Home",
    propertyPrice: 650000,
    message: "Can you provide more details about the property?",
    status: "pending",
    createdAt: "2024-01-12T11:00:00Z",
  },
  {
    id: "6",
    propertyId: "2",
    clientId: "client6",
    clientName: "Emily Davis",
    clientPhone: "+255 321 098 765",
    propertyTitle: "Luxury Family House",
    propertyPrice: 850000,
    message: "Very interested, please call me",
    status: "contacted",
    createdAt: "2024-01-11T13:30:00Z",
  },
];

export const getPendingInquiries = () => {
  return mockInquiries
    .filter((inquiry) => inquiry.status === "pending")
    .slice(0, 5);
};

export const getInquiriesByStatus = (
  status: "pending" | "contacted" | "booked" | "cancelled"
) => {
  return mockInquiries.filter((inquiry) => inquiry.status === status);
};

export const getInquiryStats = () => {
  const total = mockInquiries.length;
  const pending = getInquiriesByStatus("pending").length;
  const contacted = getInquiriesByStatus("contacted").length;
  const booked = getInquiriesByStatus("booked").length;
  const cancelled = getInquiriesByStatus("cancelled").length;

  return {
    total,
    pending,
    contacted,
    booked,
    cancelled,
  };
};
