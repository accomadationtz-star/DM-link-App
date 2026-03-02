import apiClient from "@/services/api/client";

export interface CreateInquiryPayload {
  propertyId: string;
  inquiryType: "rent" | "buy";
}

export interface CreateInquiryResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    propertyId: string;
    userId: string;
    inquiryType: string;
    createdAt: string;
  };
}

export async function createInquiry(
  payload: CreateInquiryPayload
): Promise<CreateInquiryResponse> {
  try {
    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║         CREATE INQUIRY - REQUEST                     ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("📤 Sending inquiry for property:", payload.propertyId);
    console.log("📋 Inquiry type:", payload.inquiryType);

    const response = await apiClient.post<CreateInquiryResponse>(
      "/api/inquiries",
      payload
    );

    console.log("✅ Inquiry created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to create inquiry:", error);
    throw error;
  }
}
