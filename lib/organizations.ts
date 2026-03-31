import api from "./api";

export async function validateOrgCode(code: string) {
  const response = await api.post("/organizations/validate-code", { code });
  return response.data;
}

export async function listOrganizationsApi(params?: { page?: number; limit?: number }) {
  const response = await api.get("/organizations", { params });
  return response.data;
}

export async function getOrganizationApi(id: number) {
  const response = await api.get(`/organizations/${id}`);
  return response.data;
}

export async function createOrganizationApi(data: any) {
  const response = await api.post("/organizations", data);
  return response.data;
}

export async function updateOrganizationApi(id: number, data: any) {
  const response = await api.put(`/organizations/${id}`, data);
  return response.data;
}

export async function getOrgMembersApi(orgId: number, params?: { page?: number; limit?: number }) {
  const response = await api.get(`/organizations/${orgId}/members`, { params });
  return response.data;
}

export async function getMyCreditsApi() {
  const response = await api.get("/organizations/credits/my");
  return response.data;
}
