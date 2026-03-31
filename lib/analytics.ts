import api from "./api";

export async function getUserAnalyticsApi() {
  const response = await api.get("/analytics/user");
  return response.data;
}

export async function getAdminAnalyticsApi() {
  const response = await api.get("/analytics/admin");
  return response.data;
}

export async function exportAnalyticsApi() {
  const response = await api.get("/analytics/admin/export", { responseType: "blob" });
  return response.data;
}
