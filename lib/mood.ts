import api from "./api";

export async function logMoodApi(mood: number) {
  const response = await api.post("/mood", { mood });
  return response.data;
}

export async function getMoodHistoryApi(days?: number) {
  const response = await api.get("/mood/history", { params: { days } });
  return response.data;
}
