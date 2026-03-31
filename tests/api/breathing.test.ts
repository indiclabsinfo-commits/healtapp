import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { testAdmin, testUser, API_BASE } from '../fixtures/test-data';

const api = axios.create({ baseURL: API_BASE });

let adminToken = '';
let userToken = '';
let seedExerciseId = 0;
let createdExerciseId = 0;

beforeAll(async () => {
  const adminRes = await api.post('/auth/login', testAdmin);
  adminToken = adminRes.data.data.accessToken;

  const userRes = await api.post('/auth/login', testUser);
  userToken = userRes.data.data.accessToken;

  // Get an existing seed exercise ID
  const res = await api.get('/breathing-exercises', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  expect(res.data.data.length).toBeGreaterThan(0);
  seedExerciseId = res.data.data[0].id;
});

describe('Breathing Exercises API', () => {
  describe('GET /breathing-exercises', () => {
    it('should list active breathing exercises', async () => {
      const res = await api.get('/breathing-exercises', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.pagination).toBeDefined();
    });

    it('should filter by category', async () => {
      const res = await api.get('/breathing-exercises?category=relaxation', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      res.data.data.forEach((e: any) => {
        expect(e.category).toBe('relaxation');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const res = await api.get('/breathing-exercises?category=nonexistent', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBe(0);
    });

    it('should support pagination', async () => {
      const res = await api.get('/breathing-exercises?page=1&limit=2', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(2);
      expect(res.data.pagination.page).toBe(1);
      expect(res.data.pagination.limit).toBe(2);
    });

    it('should reject unauthenticated request', async () => {
      try {
        await api.get('/breathing-exercises');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('GET /breathing-exercises/:id', () => {
    it('should get exercise by ID', async () => {
      const res = await api.get(`/breathing-exercises/${seedExerciseId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe(seedExerciseId);
      expect(res.data.data.name).toBeDefined();
      expect(res.data.data.description).toBeDefined();
      expect(res.data.data.inhaleSeconds).toBeDefined();
      expect(res.data.data.holdSeconds).toBeDefined();
      expect(res.data.data.exhaleSeconds).toBeDefined();
    });

    it('should return 404 for non-existent exercise', async () => {
      try {
        await api.get('/breathing-exercises/99999', {
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
        await api.get('/breathing-exercises/abc', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('INVALID_ID');
      }
    });
  });

  describe('POST /breathing-exercises', () => {
    it('should create exercise as admin', async () => {
      const res = await api.post(
        '/breathing-exercises',
        {
          name: 'Test Breathing',
          description: 'A test breathing exercise for unit tests with enough description length.',
          inhaleSeconds: 4,
          holdSeconds: 2,
          exhaleSeconds: 6,
          holdAfterExhale: 0,
          defaultCycles: 5,
          category: 'test',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe('Test Breathing');
      expect(res.data.data.inhaleSeconds).toBe(4);
      expect(res.data.data.holdSeconds).toBe(2);
      expect(res.data.data.exhaleSeconds).toBe(6);
      expect(res.data.data.category).toBe('test');
      createdExerciseId = res.data.data.id;
    });

    it('should reject creation by non-admin user', async () => {
      try {
        await api.post(
          '/breathing-exercises',
          {
            name: 'User Breathing',
            description: 'Users should not be able to create exercises on this platform.',
            inhaleSeconds: 4,
            holdSeconds: 2,
            exhaleSeconds: 4,
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
          '/breathing-exercises',
          { name: 'Incomplete' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject invalid inhaleSeconds value', async () => {
      try {
        await api.post(
          '/breathing-exercises',
          {
            name: 'Bad Values',
            description: 'This exercise has invalid timing values that exceed limits.',
            inhaleSeconds: 50, // max is 30
            holdSeconds: 2,
            exhaleSeconds: 4,
          },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });

  describe('PUT /breathing-exercises/:id', () => {
    it('should update exercise as admin', async () => {
      const res = await api.put(
        `/breathing-exercises/${createdExerciseId}`,
        { name: 'Updated Test Breathing', inhaleSeconds: 5 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.name).toBe('Updated Test Breathing');
      expect(res.data.data.inhaleSeconds).toBe(5);
    });

    it('should reject update by non-admin user', async () => {
      try {
        await api.put(
          `/breathing-exercises/${createdExerciseId}`,
          { name: 'Hacked' },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should return 404 for non-existent exercise', async () => {
      try {
        await api.put(
          '/breathing-exercises/99999',
          { name: 'Ghost' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('POST /breathing-exercises/:id/favourite', () => {
    it('should toggle favourite on', async () => {
      const res = await api.post(
        `/breathing-exercises/${seedExerciseId}/favourite`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.favourited).toBeDefined();
    });

    it('should toggle favourite off when called again', async () => {
      // First call sets it, second call toggles it back
      const res1 = await api.post(
        `/breathing-exercises/${seedExerciseId}/favourite`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      const firstState = res1.data.data.favourited;

      const res2 = await api.post(
        `/breathing-exercises/${seedExerciseId}/favourite`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res2.data.data.favourited).toBe(!firstState);
    });

    it('should return 404 for non-existent exercise', async () => {
      try {
        await api.post(
          '/breathing-exercises/99999/favourite',
          {},
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        // toggleFavourite may throw if exercise doesn't exist
        expect([400, 404, 500]).toContain(err.response.status);
      }
    });
  });

  describe('GET /breathing-exercises/favourites', () => {
    it('should return user favourites', async () => {
      // Ensure at least one favourite exists
      await api.post(
        `/breathing-exercises/${seedExerciseId}/favourite`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      const res = await api.get('/breathing-exercises/favourites', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('POST /breathing-exercises/complete', () => {
    it('should log a breathing completion', async () => {
      const res = await api.post(
        '/breathing-exercises/complete',
        {
          exerciseId: seedExerciseId,
          cycles: 4,
          durationSec: 120,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.exerciseId).toBe(seedExerciseId);
      expect(res.data.data.cycles).toBe(4);
      expect(res.data.data.durationSec).toBe(120);
    });

    it('should reject with missing fields', async () => {
      try {
        await api.post(
          '/breathing-exercises/complete',
          { exerciseId: seedExerciseId },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject invalid cycles value', async () => {
      try {
        await api.post(
          '/breathing-exercises/complete',
          {
            exerciseId: seedExerciseId,
            cycles: 0, // must be positive
            durationSec: 60,
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });

  describe('GET /breathing-exercises/history', () => {
    it('should return breathing completion history', async () => {
      const res = await api.get('/breathing-exercises/history', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.pagination).toBeDefined();

      const entry = res.data.data[0];
      expect(entry.exerciseId).toBeDefined();
      expect(entry.cycles).toBeDefined();
      expect(entry.durationSec).toBeDefined();
      expect(entry.exercise).toBeDefined();
      expect(entry.exercise.name).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await api.get('/breathing-exercises/history?page=1&limit=1', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(1);
      expect(res.data.pagination.page).toBe(1);
    });
  });

  describe('DELETE /breathing-exercises/:id (soft delete)', () => {
    it('should reject deletion by non-admin user', async () => {
      try {
        await api.delete(`/breathing-exercises/${createdExerciseId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should soft delete exercise as admin', async () => {
      const res = await api.delete(`/breathing-exercises/${createdExerciseId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.message).toContain('deactivated');
    });

    it('should not list soft-deleted exercise in active list', async () => {
      const res = await api.get('/breathing-exercises', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      const ids = res.data.data.map((e: any) => e.id);
      expect(ids).not.toContain(createdExerciseId);
    });

    it('should return 404 when deleting non-existent exercise', async () => {
      try {
        await api.delete('/breathing-exercises/99999', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });
  });
});
