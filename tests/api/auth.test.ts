import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { testAdmin, testUser, API_BASE } from '../fixtures/test-data';

const api = axios.create({ baseURL: API_BASE });

let adminToken = '';
let userToken = '';
let newUserEmail = `vitest-${Date.now()}@mindcare.com`;

describe('Auth API', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await api.post('/auth/register', {
        name: 'Vitest User',
        email: newUserEmail,
        password: 'Test@123',
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.user.email).toBe(newUserEmail);
      expect(res.data.data.accessToken).toBeDefined();
      expect(res.data.data.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      try {
        await api.post('/auth/register', {
          name: 'Duplicate',
          email: newUserEmail,
          password: 'Test@123',
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(409);
        expect(err.response.data.code).toBe('EMAIL_EXISTS');
      }
    });

    it('should reject invalid email', async () => {
      try {
        await api.post('/auth/register', {
          name: 'Bad Email',
          email: 'not-an-email',
          password: 'Test@123',
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject short password', async () => {
      try {
        await api.post('/auth/register', {
          name: 'Short Pass',
          email: 'shortpass@test.com',
          password: '123',
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });

  describe('POST /auth/login', () => {
    it('should login admin', async () => {
      const res = await api.post('/auth/login', testAdmin);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.user.role).toBe('ADMIN');
      expect(res.data.data.accessToken).toBeDefined();
      adminToken = res.data.data.accessToken;
    });

    it('should login user', async () => {
      const res = await api.post('/auth/login', testUser);

      expect(res.status).toBe(200);
      expect(res.data.data.user.role).toBe('USER');
      userToken = res.data.data.accessToken;
    });

    it('should reject wrong password', async () => {
      try {
        await api.post('/auth/login', {
          email: testAdmin.email,
          password: 'wrong',
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
        expect(err.response.data.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should reject non-existent email', async () => {
      try {
        await api.post('/auth/login', {
          email: 'nonexistent@test.com',
          password: 'Test@123',
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', async () => {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.email).toBe(testUser.email);
      expect(res.data.data.password).toBeUndefined();
    });

    it('should reject without token', async () => {
      try {
        await api.get('/auth/me');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });

    it('should reject invalid token', async () => {
      try {
        await api.get('/auth/me', {
          headers: { Authorization: 'Bearer invalid-token' },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token', async () => {
      // First login to get refresh token
      const loginRes = await api.post('/auth/login', testUser);
      const refreshToken = loginRes.data.data.refreshToken;

      const res = await api.post('/auth/refresh', { refreshToken });

      expect(res.status).toBe(200);
      expect(res.data.data.accessToken).toBeDefined();
      expect(res.data.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      try {
        await api.post('/auth/refresh', { refreshToken: 'invalid' });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('PUT /auth/me', () => {
    it('should update user profile', async () => {
      const res = await api.put(
        '/auth/me',
        { name: 'Sarah Updated', phone: '9876543210' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.name).toBe('Sarah Updated');
      expect(res.data.data.phone).toBe('9876543210');
    });
  });

  describe('PUT /auth/change-password', () => {
    it('should reject wrong current password', async () => {
      try {
        await api.put(
          '/auth/change-password',
          { currentPassword: 'wrong', newPassword: 'NewPass@123' },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('WRONG_PASSWORD');
      }
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should accept valid email without revealing if it exists', async () => {
      const res = await api.post('/auth/forgot-password', {
        email: testUser.email,
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should accept unknown email without error', async () => {
      const res = await api.post('/auth/forgot-password', {
        email: 'unknown@test.com',
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });
});
