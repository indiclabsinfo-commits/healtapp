import api from "./api";

export async function listUsersApi(params?: {
  page?: number; limit?: number; search?: string; status?: string;
}) {
  const response = await api.get("/users", { params });
  return response.data;
}

export async function getUserApi(id: number) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

export async function updateUserApi(id: number, data: {
  name?: string; email?: string; role?: string; status?: string;
}) {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
}

export async function toggleUserStatusApi(id: number, status: string) {
  const response = await api.patch(`/users/${id}/status`, { status });
  return response.data;
}

export async function bulkRegisterApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/users/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function bulkHistoryApi(params?: { page?: number; limit?: number }) {
  const response = await api.get("/users/bulk/history", { params });
  return response.data;
}

export async function downloadTemplateApi() {
  const response = await api.get("/users/bulk/template", { responseType: "blob" });
  return response.data;
}
