import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { testAdmin, testUser, API_BASE } from '../fixtures/test-data';

const api = axios.create({ baseURL: API_BASE });

let adminToken = '';
let userToken = '';
let seedSessionId = 0;
let createdSessionId = 0;

beforeAll(async () => {
  const adminRes = await api.post('/auth/login', testAdmin);
  adminToken = adminRes.data.data.accessToken;

  const userRes = await api.post('/auth/login', testUser);
  userToken = userRes.data.data.accessToken;

  // Get a seed theory session
  const res = await api.get('/theory-sessions', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  expect(res.data.data.length).toBeGreaterThan(0);
  seedSessionId = res.data.data[0].id;
});

describe('Theory Sessions API', () => {
  describe('GET /theory-sessions', () => {
    it('should list theory sessions', async () => {
      const res = await api.get('/theory-sessions', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await api.get('/theory-sessions?status=published', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      res.data.data.forEach((s: any) => {
        expect(s.status).toBe('published');
      });
    });

    it('should support pagination', async () => {
      const res = await api.get('/theory-sessions?page=1&limit=1', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(1);
      expect(res.data.pagination.page).toBe(1);
      expect(res.data.pagination.limit).toBe(1);
    });

    it('should reject unauthenticated request', async () => {
      try {
        await api.get('/theory-sessions');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('GET /theory-sessions/:id', () => {
    it('should get session by ID with modules', async () => {
      const res = await api.get(`/theory-sessions/${seedSessionId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe(seedSessionId);
      expect(res.data.data.title).toBeDefined();
      expect(res.data.data.description).toBeDefined();
      expect(res.data.data.modules).toBeDefined();
      expect(res.data.data.duration).toBeDefined();
      expect(res.data.data.status).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      try {
        await api.get('/theory-sessions/99999', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });

    it('should return 400 for invalid ID', async () => {
      try {
        await api.get('/theory-sessions/abc', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('INVALID_ID');
      }
    });
  });

  describe('POST /theory-sessions', () => {
    it('should create theory session as admin', async () => {
      const res = await api.post(
        '/theory-sessions',
        {
          title: 'Test Theory Session',
          description: 'A test theory session created by automated tests for validation purposes.',
          modules: [
            { title: 'Module 1', content: 'Introduction to testing.' },
            { title: 'Module 2', content: 'Advanced testing techniques.' },
          ],
          duration: 30,
          status: 'draft',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.title).toBe('Test Theory Session');
      expect(res.data.data.duration).toBe(30);
      expect(res.data.data.status).toBe('draft');
      createdSessionId = res.data.data.id;
    });

    it('should reject creation by non-admin user', async () => {
      try {
        await api.post(
          '/theory-sessions',
          {
            title: 'User Theory',
            description: 'Users should not be allowed to create theory sessions on this platform.',
            modules: [{ title: 'M1', content: 'Content' }],
            duration: 15,
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should reject with missing required fields', async () => {
      try {
        await api.post(
          '/theory-sessions',
          { title: 'Incomplete' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject with empty modules array', async () => {
      try {
        await api.post(
          '/theory-sessions',
          {
            title: 'No Modules',
            description: 'This theory session has zero modules which is not allowed.',
            modules: [],
            duration: 10,
          },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });

    it('should reject with negative duration', async () => {
      try {
        await api.post(
          '/theory-sessions',
          {
            title: 'Bad Duration',
            description: 'This theory session has invalid negative duration value set.',
            modules: [{ title: 'M1', content: 'Content' }],
            duration: -5,
          },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });

  describe('PUT /theory-sessions/:id', () => {
    it('should update session title as admin', async () => {
      const res = await api.put(
        `/theory-sessions/${createdSessionId}`,
        { title: 'Updated Test Theory Session' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.title).toBe('Updated Test Theory Session');
    });

    it('should update session status to published', async () => {
      const res = await api.put(
        `/theory-sessions/${createdSessionId}`,
        { status: 'published' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.status).toBe('published');
    });

    it('should update modules', async () => {
      const newModules = [
        { title: 'Updated Module 1', content: 'New content for module one.' },
        { title: 'Updated Module 2', content: 'New content for module two.' },
        { title: 'New Module 3', content: 'Additional module added.' },
      ];

      const res = await api.put(
        `/theory-sessions/${createdSessionId}`,
        { modules: newModules },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(200);
      const modules = res.data.data.modules;
      // modules may be stored as JSON string or object
      const parsed = typeof modules === 'string' ? JSON.parse(modules) : modules;
      expect(parsed.length).toBe(3);
    });

    it('should reject update by non-admin user', async () => {
      try {
        await api.put(
          `/theory-sessions/${createdSessionId}`,
          { title: 'Hacked' },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should return 404 for non-existent session', async () => {
      try {
        await api.put(
          '/theory-sessions/99999',
          { title: 'Ghost' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('POST /theory-sessions/:id/progress', () => {
    it('should update user progress', async () => {
      const res = await api.post(
        `/theory-sessions/${seedSessionId}/progress`,
        { completedModules: [0, 1], completed: false },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.theorySessionId).toBe(seedSessionId);
      const completedModules = res.data.data.completedModules;
      const parsed = typeof completedModules === 'string' ? JSON.parse(completedModules) : completedModules;
      expect(parsed).toContain(0);
      expect(parsed).toContain(1);
      expect(res.data.data.completed).toBe(false);
    });

    it('should mark session as completed', async () => {
      const res = await api.post(
        `/theory-sessions/${seedSessionId}/progress`,
        { completedModules: [0, 1, 2, 3], completed: true },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.completed).toBe(true);
    });

    it('should upsert progress (update existing)', async () => {
      // First call
      await api.post(
        `/theory-sessions/${seedSessionId}/progress`,
        { completedModules: [0], completed: false },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      // Second call updates
      const res = await api.post(
        `/theory-sessions/${seedSessionId}/progress`,
        { completedModules: [0, 1, 2], completed: false },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(200);
      const completedModules = res.data.data.completedModules;
      const parsed = typeof completedModules === 'string' ? JSON.parse(completedModules) : completedModules;
      expect(parsed.length).toBe(3);
    });

    it('should return 404 for non-existent session', async () => {
      try {
        await api.post(
          '/theory-sessions/99999/progress',
          { completedModules: [0] },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });

    it('should reject with missing completedModules', async () => {
      try {
        await api.post(
          `/theory-sessions/${seedSessionId}/progress`,
          { completed: true },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('GET /theory-sessions/:id/progress', () => {
    it('should get user progress for a session', async () => {
      const res = await api.get(`/theory-sessions/${seedSessionId}/progress`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.completedModules).toBeDefined();
      expect(res.data.data.completed).toBeDefined();
    });

    it('should return default progress for session with no progress', async () => {
      // Use the test-created session that the user has not started
      const res = await api.get(`/theory-sessions/${createdSessionId}/progress`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      const modules = res.data.data.completedModules;
      const parsed = typeof modules === 'string' ? JSON.parse(modules) : modules;
      expect(parsed.length).toBe(0);
      expect(res.data.data.completed).toBe(false);
    });
  });

  describe('DELETE /theory-sessions/:id', () => {
    it('should reject deletion by non-admin user', async () => {
      try {
        await api.delete(`/theory-sessions/${createdSessionId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should delete theory session as admin', async () => {
      const res = await api.delete(`/theory-sessions/${createdSessionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should return 404 when deleting non-existent session', async () => {
      try {
        await api.delete('/theory-sessions/99999', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });

    it('should confirm deletion by verifying 404 on get', async () => {
      try {
        await api.get(`/theory-sessions/${createdSessionId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
      }
    });
  });
});
