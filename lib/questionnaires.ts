import api from "./api";

export async function listQuestionnairesApi(params?: { page?: number; limit?: number; published?: string }) {
  const response = await api.get("/questionnaires", { params });
  return response.data;
}

export async function getQuestionnaireApi(id: number) {
  const response = await api.get(`/questionnaires/${id}`);
  return response.data;
}

export async function createQuestionnaireApi(data: any) {
  const response = await api.post("/questionnaires", data);
  return response.data;
}

export async function updateQuestionnaireApi(id: number, data: any) {
  const response = await api.put(`/questionnaires/${id}`, data);
  return response.data;
}

export async function deleteQuestionnaireApi(id: number) {
  const response = await api.delete(`/questionnaires/${id}`);
  return response.data;
}

export async function listCategoriesApi() {
  const response = await api.get("/categories");
  return response.data;
}

export async function getLevelsApi(categoryId: number) {
  const response = await api.get(`/categories/${categoryId}/levels`);
  return response.data;
}

export async function getQuestionsApi(levelId: number) {
  const response = await api.get(`/levels/${levelId}/questions`);
  return response.data;
}

export async function createCategoryApi(data: { name: string; description?: string }) {
  const response = await api.post("/categories", data);
  return response.data;
}

export async function createQuestionApi(data: {
  text: string;
  type: "MCQ" | "SCALE" | "YESNO";
  options: any;
  levelId: number;
}) {
  const response = await api.post("/questions", data);
  return response.data;
}

export async function createLevelApi(data: { name: string; categoryId: number; order?: number }) {
  const response = await api.post("/levels", data);
  return response.data;
}
