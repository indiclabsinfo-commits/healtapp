export const testAdmin = {
  email: 'admin@mindcare.com',
  password: 'Admin@123',
};

export const testUser = {
  email: 'user@mindcare.com',
  password: 'User@123',
};

export const newUser = {
  name: 'Test Registration',
  email: `test-${Date.now()}@mindcare.com`,
  password: 'Test@123',
};

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
