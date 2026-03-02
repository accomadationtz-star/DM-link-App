import apiClient from "@/services/api/client";
import { Property } from "../../../types/property";

export interface PropertyLocation {
  region: string;
  district: string;
  street: string;
}

export interface UploadPropertyPayload {
  title: string;
  description: string;
  type: "house" | "apartment" | "office" | "hotel";
  purpose: "sell" | "rent";
  price: number;
  bedrooms: number;
  area: number;
  location: PropertyLocation;

  images?: {
    uri: string;
    name: string;
    type: string;
  }[];

  videos?: {
    uri: string;
    name: string;
    type: string;
  }[];
}

export interface UploadPropertyResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function uploadProperty(
  payload: UploadPropertyPayload,
): Promise<UploadPropertyResponse> {
  try {
    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║         PROPERTY UPLOAD - FRONTEND START             ║");
    console.log("╚═══════════════════════════════════════════════════════╝");

    const formData = new FormData();

    // Append text fields
    console.log("\n📝 Appending text fields...");
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("type", payload.type);
    formData.append("purpose", payload.purpose);
    formData.append("price", String(payload.price));
    formData.append("bedrooms", String(payload.bedrooms));
    formData.append("area", String(payload.area));
    console.log("  ✓ Title:", payload.title);
    console.log("  ✓ Type:", payload.type);
    console.log("  ✓ Purpose:", payload.purpose);
    console.log("  ✓ Price:", payload.price);

    // CRITICAL FIX: Send location as JSON string, not as separate fields
    console.log("\n📍 Appending location...");
    console.log("  Location object:", payload.location);
    const locationJson = JSON.stringify(payload.location);
    console.log("  Location JSON:", locationJson);
    formData.append("location", locationJson);
    console.log("  ✓ Location appended as JSON string");

    // Append images
    if (payload.images && payload.images.length > 0) {
      console.log(`\n🖼️  Appending ${payload.images.length} image(s)...`);

      for (let i = 0; i < payload.images.length; i++) {
        const image = payload.images[i];
        console.log(`  [${i + 1}/${payload.images.length}] ${image.name}`);
        console.log(`      Type: ${image.type}`);
        console.log(`      URI: ${image.uri.substring(0, 50)}...`);

        // Create file object for React Native FormData
        const imageFile = {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any;

        formData.append("images", imageFile);
      }
      console.log(
        `  ✅ ${payload.images.length} image(s) appended successfully`,
      );
    } else {
      console.log("\n🖼️  No images to upload");
    }

    // Append videos
    if (payload.videos && payload.videos.length > 0) {
      console.log(`\n🎥 Appending ${payload.videos.length} video(s)...`);

      for (let i = 0; i < payload.videos.length; i++) {
        const video = payload.videos[i];
        console.log(`  [${i + 1}/${payload.videos.length}] ${video.name}`);
        console.log(`      Type: ${video.type}`);
        console.log(`      URI: ${video.uri.substring(0, 50)}...`);

        // Create file object for React Native FormData
        const videoFile = {
          uri: video.uri,
          name: video.name,
          type: video.type,
        } as any;

        formData.append("videos", videoFile);
      }
      console.log(
        `  ✅ ${payload.videos.length} video(s) appended successfully`,
      );
    } else {
      console.log("\n🎥 No videos to upload");
    }

    console.log("\n📤 Sending request to:", "/api/properties");
    console.log("   Using apiClient with baseURL:", apiClient.defaults.baseURL);

    // Send request with extended timeout for large files
    const res = await apiClient.post<UploadPropertyResponse>(
      "/api/properties",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // 2 minutes
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            console.log(`📊 Upload progress: ${percentCompleted}%`);
          }
        },
      },
    );

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║         PROPERTY UPLOAD - SUCCESS ✅                  ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("Response:", res.data);

    return res.data;
  } catch (error: any) {
    console.error(
      "\n╔═══════════════════════════════════════════════════════╗",
    );
    console.error("║         PROPERTY UPLOAD - FAILED ❌                   ║");
    console.error("╚═══════════════════════════════════════════════════════╝");

    if (error.response) {
      // Server responded with error
      console.error("Server Error Details:");
      console.error("  Status:", error.response.status);
      console.error("  Message:", error.response.data?.message);
      console.error(
        "  Full response:",
        JSON.stringify(error.response.data, null, 2),
      );

      throw new Error(
        error.response.data?.message ||
          `Upload failed with status ${error.response.status}`,
      );
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:");
      console.error("  No response received from server");
      console.error(
        "  Check if backend is running at:",
        apiClient.defaults.baseURL,
      );
      console.error("  Request timeout:", error.config?.timeout, "ms");

      throw new Error(
        "No response from server. Please check your connection and try again.",
      );
    } else {
      // Request setup error
      console.error("Request Error:", error.message);
      throw new Error(error.message || "Failed to upload property");
    }
  }
}

export interface PropertyListResponse {
  success: boolean;
  data: Property[];
  totalPages: number;
  currentPage: number;
  total: number;
}

// Fetch all properties (admin/agent view)
export async function getAllProperties(
  page = 1,
  limit = 20,
): Promise<PropertyListResponse> {
  const res = await apiClient.get<PropertyListResponse>(
    `/api/properties/all?page=${page}&limit=${limit}`,
  );
  return res.data;
}

export async function getProperties(
  page = 1,
  limit = 10,
): Promise<PropertyListResponse> {
  const res = await apiClient.get<PropertyListResponse>(`/api/properties`);
  return res.data;
}

export async function getPropertyById(id: string) {
  const res = await apiClient.get(`/api/properties/${id}`);
  return res.data;
}

export async function getPropertyDetailsForAgent(id: string) {
  try {
    const res = await apiClient.get(`/api/properties/${id}`);
    // Handle both { success, data } and direct data responses
    const data = res.data?.data || res.data;
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching property details:", error);
    throw error;
  }
}

export async function updatePropertyStatus(id: string, status: string) {
  const res = await apiClient.patch(`/api/properties/${id}/status`, {
    status,
  });

  return res.data;
}
