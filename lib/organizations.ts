import api from "./api";

export async function registerOrgApi(data: {
  name: string; type: string; contactEmail: string; contactPhone?: string;
  address?: string; city?: string; principalName: string; principalEmail: string; principalPassword: string;
}) {
  const response = await api.post("/organizations/register", data);
  return response.data;
}

export async function bulkAddMembersApi(orgId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/organizations/${orgId}/members/bulk`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

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

export async function getOrgBulkHistoryApi(orgId: number, params?: { limit?: number }) {
  const response = await api.get(`/organizations/${orgId}/bulk/history`, { params });
  return response.data;
}
