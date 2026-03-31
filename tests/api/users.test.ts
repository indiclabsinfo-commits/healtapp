import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { testAdmin, testUser, API_BASE } from '../fixtures/test-data';

const api = axios.create({ baseURL: API_BASE });

let adminToken = '';
let userToken = '';

beforeAll(async () => {
  const adminRes = await api.post('/auth/login', testAdmin);
  adminToken = adminRes.data.data.accessToken;

  const userRes = await api.post('/auth/login', testUser);
  userToken = userRes.data.data.accessToken;
});

describe('Users API', () => {
  describe('GET /users', () => {
    it('should list users for admin', async () => {
      const res = await api.get('/users', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.pagination).toBeDefined();
      expect(res.data.pagination.total).toBeGreaterThan(0);
    });

    it('should reject non-admin user', async () => {
      try {
        await api.get('/users', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should search users by name', async () => {
      const res = await api.get('/users?search=Sarah', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.data[0].name).toContain('Sarah');
    });

    it('should filter by status', async () => {
      const res = await api.get('/users?status=ACTIVE', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      res.data.data.forEach((u: any) => {
        expect(u.status).toBe('ACTIVE');
      });
    });
  });

  describe('GET /users/:id', () => {
    it('should get user detail with assessments', async () => {
      const listRes = await api.get('/users?limit=1', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const userId = listRes.data.data[0].id;

      const res = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.id).toBe(userId);
      expect(res.data.data.assessments).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      try {
        await api.get('/users/99999', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
      }
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user name', async () => {
      const listRes = await api.get('/users?search=Rahul', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const user = listRes.data.data[0];

      const res = await api.put(`/users/${user.id}`, { name: 'Rahul Updated' }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.name).toBe('Rahul Updated');

      // Restore
      await api.put(`/users/${user.id}`, { name: 'Rahul Patel' }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });

  describe('PATCH /users/:id/status', () => {
    it('should toggle user status', async () => {
      const listRes = await api.get('/users?search=Vikram', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const user = listRes.data.data[0];

      const res = await api.patch(`/users/${user.id}/status`, { status: 'INACTIVE' }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.status).toBe('INACTIVE');

      // Restore
      await api.patch(`/users/${user.id}/status`, { status: 'ACTIVE' }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });

  describe('Bulk Registration', () => {
    it('should download CSV template', async () => {
      const res = await api.get('/users/bulk/template', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('should upload CSV and register users', async () => {
      // Use unique emails each run to avoid duplicate conflicts
      const ts = Date.now();
      const tmpPath = path.join(__dirname, '../fixtures/test-csv-tmp.csv');
      fs.writeFileSync(tmpPath,
        `name,email,phone\nBulk User One,bulk1.${ts}@test.com,1234567890\nBulk User Two,bulk2.${ts}@test.com,\nBulk User Three,bulk3.${ts}@test.com,9876543210\n`
      );
      const csvPath = tmpPath;
      const form = new FormData();
      form.append('file', fs.createReadStream(csvPath));

      const res = await api.post('/users/bulk', form, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          ...form.getHeaders(),
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.data.totalRows).toBe(3);
      expect(res.data.data.successCount).toBeGreaterThan(0);
    });

    it('should get bulk upload history', async () => {
      const res = await api.get('/users/bulk/history', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });
});
