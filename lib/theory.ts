import api from "./api";

export async function listTheoryApi(params?: { page?: number; limit?: number; status?: string }) {
  const response = await api.get("/theory-sessions", { params });
  return response.data;
}

export async function getTheoryApi(id: number) {
  const response = await api.get(`/theory-sessions/${id}`);
  return response.data;
}

export async function createTheoryApi(data: any) {
  const response = await api.post("/theory-sessions", data);
  return response.data;
}

export async function updateTheoryApi(id: number, data: any) {
  const response = await api.put(`/theory-sessions/${id}`, data);
  return response.data;
}

export async function deleteTheoryApi(id: number) {
  const response = await api.delete(`/theory-sessions/${id}`);
  return response.data;
}

export async function updateProgressApi(sessionId: number, data: { completedModules: number[]; completed?: boolean }) {
  const response = await api.post(`/theory-sessions/${sessionId}/progress`, data);
  return response.data;
}

export async function getProgressApi(sessionId: number) {
  const response = await api.get(`/theory-sessions/${sessionId}/progress`);
  return response.data;
}
