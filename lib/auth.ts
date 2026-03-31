import api from "./api";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export async function loginApi(data: LoginData) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

export async function registerApi(data: RegisterData) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function forgotPasswordApi(email: string) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPasswordApi(token: string, password: string) {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
}

export async function getMeApi() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function updateProfileApi(data: Partial<{
  name: string;
  phone: string;
  avatar: string;
  gender: string;
  age: number;
}>) {
  const response = await api.put("/auth/me", data);
  return response.data;
}

export async function changePasswordApi(currentPassword: string, newPassword: string) {
  const response = await api.put("/auth/change-password", { currentPassword, newPassword });
  return response.data;
}
