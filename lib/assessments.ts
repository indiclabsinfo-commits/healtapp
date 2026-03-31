import api from "./api";

export async function submitAssessmentApi(data: { questionnaireId: number; answers: Array<{ questionId: number; answer: any }> }) {
  const response = await api.post("/assessments", data);
  return response.data;
}

export async function getMyAssessmentsApi(params?: { page?: number; limit?: number }) {
  const response = await api.get("/assessments/my", { params });
  return response.data;
}

export async function getAssessmentApi(id: number) {
  const response = await api.get(`/assessments/my/${id}`);
  return response.data;
}
