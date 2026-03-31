import api from "./api";

export async function getCounsellorSlotsApi(counsellorId: number) {
  const response = await api.get(`/consultations/counsellors/${counsellorId}/slots`);
  return response.data;
}

export async function setCounsellorSlotsApi(counsellorId: number, slots: {
  dayOfWeek: number; startTime: string; endTime: string; duration: number;
}[]) {
  const response = await api.put(`/consultations/counsellors/${counsellorId}/slots`, slots);
  return response.data;
}

export async function getAvailabilityApi(counsellorId: number, date: string) {
  const response = await api.get(`/consultations/counsellors/${counsellorId}/availability`, {
    params: { date },
  });
  return response.data;
}

export async function bookConsultationApi(data: {
  counsellorId: number; date: string; time: string; type?: string;
}, orgId: number) {
  const response = await api.post(`/consultations/book?orgId=${orgId}`, data);
  return response.data;
}

export async function getMyConsultationsApi(params?: { page?: number; limit?: number }) {
  const response = await api.get("/consultations/my", { params });
  return response.data;
}

export async function getCounsellorConsultationsApi(counsellorId: number, params?: { page?: number; limit?: number }) {
  const response = await api.get("/consultations/counsellor", {
    params: { counsellorId, ...params },
  });
  return response.data;
}

export async function getConsultationApi(id: number) {
  const response = await api.get(`/consultations/${id}`);
  return response.data;
}

export async function updateConsultationStatusApi(id: number, status: string) {
  const response = await api.put(`/consultations/${id}/status`, { status });
  return response.data;
}

export async function updateConsultationNotesApi(id: number, data: { notes?: string; summary?: string }) {
  const response = await api.put(`/consultations/${id}/notes`, data);
  return response.data;
}
