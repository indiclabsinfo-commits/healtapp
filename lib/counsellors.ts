import api from "./api";

export async function listCounsellorsApi(params?: {
  page?: number; limit?: number; search?: string; tag?: string;
}) {
  const response = await api.get("/counsellors", { params });
  return response.data;
}

export async function getCounsellorApi(id: number) {
  const response = await api.get(`/counsellors/${id}`);
  return response.data;
}

export async function createCounsellorApi(formData: FormData) {
  const response = await api.post("/counsellors", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function updateCounsellorApi(id: number, formData: FormData) {
  const response = await api.put(`/counsellors/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteCounsellorApi(id: number) {
  const response = await api.delete(`/counsellors/${id}`);
  return response.data;
}
