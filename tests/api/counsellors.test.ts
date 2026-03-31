import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
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

describe('Counsellors API', () => {
  describe('GET /counsellors', () => {
    it('should list counsellors for authenticated user', async () => {
      const res = await api.get('/counsellors', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      // Each counsellor should have tags
      expect(res.data.data[0].tags).toBeDefined();
    });

    it('should filter by tag', async () => {
      const res = await api.get('/counsellors?tag=Anxiety', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      res.data.data.forEach((c: any) => {
        const tagNames = c.tags.map((t: any) => t.name);
        expect(tagNames).toContain('Anxiety');
      });
    });

    it('should search by name', async () => {
      const res = await api.get('/counsellors?search=Priya', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /counsellors/:id', () => {
    it('should get counsellor detail', async () => {
      const listRes = await api.get('/counsellors', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const id = listRes.data.data[0].id;

      const res = await api.get(`/counsellors/${id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.id).toBe(id);
      expect(res.data.data.tags).toBeDefined();
    });
  });

  describe('POST /counsellors', () => {
    it('should create counsellor (admin)', async () => {
      const res = await api.post('/counsellors', {
        name: 'Dr. Test Counsellor',
        specialization: 'Test Specialization',
        qualifications: 'PhD in Testing, MSc in QA',
        experience: 5,
        bio: 'A test counsellor for automated testing purposes.',
        tags: JSON.stringify(['Testing', 'Automation']),
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(201);
      expect(res.data.data.name).toBe('Dr. Test Counsellor');
      expect(res.data.data.tags.length).toBe(2);
    });

    it('should reject non-admin', async () => {
      try {
        await api.post('/counsellors', {
          name: 'Unauthorized',
          specialization: 'Test',
          qualifications: 'Not authorized to create',
          experience: 1,
          bio: 'Should not be created by non-admin user.',
        }, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
      }
    });
  });

  describe('DELETE /counsellors/:id', () => {
    it('should soft delete (deactivate) counsellor', async () => {
      // Create one to delete
      const createRes = await api.post('/counsellors', {
        name: 'Dr. To Delete',
        specialization: 'Deletion',
        qualifications: 'Will be deactivated soon enough',
        experience: 1,
        bio: 'This counsellor will be deactivated in testing.',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const id = createRes.data.data.id;

      const res = await api.delete(`/counsellors/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.message).toBe('Counsellor deactivated');
    });
  });
});
