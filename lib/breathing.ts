import api from "./api";

export async function listBreathingApi(params?: { page?: number; limit?: number; category?: string }) {
  const response = await api.get("/breathing-exercises", { params });
  return response.data;
}

export async function getBreathingApi(id: number) {
  const response = await api.get(`/breathing-exercises/${id}`);
  return response.data;
}

export async function createBreathingApi(data: any) {
  const response = await api.post("/breathing-exercises", data);
  return response.data;
}

export async function updateBreathingApi(id: number, data: any) {
  const response = await api.put(`/breathing-exercises/${id}`, data);
  return response.data;
}

export async function deleteBreathingApi(id: number) {
  const response = await api.delete(`/breathing-exercises/${id}`);
  return response.data;
}

export async function toggleFavouriteApi(id: number) {
  const response = await api.post(`/breathing-exercises/${id}/favourite`);
  return response.data;
}

export async function getFavouritesApi() {
  const response = await api.get("/breathing-exercises/favourites");
  return response.data;
}

export async function logCompletionApi(data: { exerciseId: number; cycles: number; durationSec: number }) {
  const response = await api.post("/breathing-exercises/complete", data);
  return response.data;
}

export async function getBreathingHistoryApi(params?: { page?: number; limit?: number }) {
  const response = await api.get("/breathing-exercises/history", { params });
  return response.data;
}
