import apiClient from "@/services/api/client";

export interface AgentDashboardResponse {
  success: boolean;
  data: {
    properties: {
      total: number;
      available: number;
      booked: number;
      rented?: number;
      sold: number;
    };
    inquiries: {
      total: number;
      pending: number;
      contacted: number;
      booked: number;
      cancelled?: number;
    };
    recentPendingInquiries: {
      _id: string;
      status: "pending" | "contacted" | "booked" | "cancelled";
      message?: string;
      createdAt: string;
      user?: {
        username?: string;
        phoneNumber?: string;
      };
      property?: {
        title?: string;
        price?: number;
        location?: {
          region?: string;
          district?: string;
        };
      };
    }[];
  };
}

export async function getAgentDashboard() {
  const response = await apiClient.get<AgentDashboardResponse>(
    "/api/agent/dashboard",
  );
  console.log("Agent Dashboard Data:", response.data);
  return response.data;
}
