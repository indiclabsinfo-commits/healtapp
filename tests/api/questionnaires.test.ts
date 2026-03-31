import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { testAdmin, testUser, API_BASE } from '../fixtures/test-data';

const api = axios.create({ baseURL: API_BASE });

let adminToken = '';
let userToken = '';
let seedQuestionnaireId = 0;
let createdQuestionnaireId = 0;
let seedCategoryId = 0;
let seedLevelId = 0;
let seedQuestionIds: number[] = [];

beforeAll(async () => {
  const adminRes = await api.post('/auth/login', testAdmin);
  adminToken = adminRes.data.data.accessToken;

  const userRes = await api.post('/auth/login', testUser);
  userToken = userRes.data.data.accessToken;

  // Get seed data IDs for creating questionnaires
  const catRes = await api.get('/categories', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const categories = catRes.data.data;
  seedCategoryId = categories[0].id;

  const levelRes = await api.get(`/categories/${seedCategoryId}/levels`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const levels = levelRes.data.data;
  seedLevelId = levels[0].id;

  const questionRes = await api.get(`/levels/${seedLevelId}/questions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  seedQuestionIds = questionRes.data.data.map((q: any) => q.id);

  // Get existing seed questionnaire ID
  const qRes = await api.get('/questionnaires', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (qRes.data.data.length > 0) {
    seedQuestionnaireId = qRes.data.data[0].id;
  }
});

describe('Questionnaires API', () => {
  describe('GET /questionnaires', () => {
    it('should list questionnaires for authenticated user', async () => {
      const res = await api.get('/questionnaires', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.pagination).toBeDefined();
    });

    it('should filter by published=true', async () => {
      const res = await api.get('/questionnaires?published=true', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      res.data.data.forEach((q: any) => {
        expect(q.published).toBe(true);
      });
    });

    it('should filter by published=false', async () => {
      const res = await api.get('/questionnaires?published=false', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      res.data.data.forEach((q: any) => {
        expect(q.published).toBe(false);
      });
    });

    it('should support pagination', async () => {
      const res = await api.get('/questionnaires?page=1&limit=1', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(1);
      expect(res.data.pagination.page).toBe(1);
      expect(res.data.pagination.limit).toBe(1);
    });

    it('should reject unauthenticated request', async () => {
      try {
        await api.get('/questionnaires');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('GET /questionnaires/:id', () => {
    it('should get questionnaire by ID with questions populated', async () => {
      const res = await api.get(`/questionnaires/${seedQuestionnaireId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe(seedQuestionnaireId);
      expect(res.data.data.title).toBeDefined();
      expect(res.data.data.categoryId).toBeDefined();
      expect(res.data.data.levelId).toBeDefined();
      expect(Array.isArray(res.data.data.questions)).toBe(true);
      expect(res.data.data.questions.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent questionnaire', async () => {
      try {
        await api.get('/questionnaires/99999', {
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
        await api.get('/questionnaires/abc', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('INVALID_ID');
      }
    });
  });

  describe('POST /questionnaires', () => {
    it('should create questionnaire as admin', async () => {
      const res = await api.post(
        '/questionnaires',
        {
          title: 'Test Questionnaire',
          categoryId: seedCategoryId,
          levelId: seedLevelId,
          questionIds: seedQuestionIds.slice(0, 2),
          published: false,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.title).toBe('Test Questionnaire');
      expect(res.data.data.categoryId).toBe(seedCategoryId);
      expect(res.data.data.levelId).toBe(seedLevelId);
      createdQuestionnaireId = res.data.data.id;
    });

    it('should reject creation by non-admin user', async () => {
      try {
        await api.post(
          '/questionnaires',
          {
            title: 'User Questionnaire',
            categoryId: seedCategoryId,
            levelId: seedLevelId,
            questionIds: seedQuestionIds.slice(0, 1),
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
          '/questionnaires',
          { title: 'Incomplete' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject with empty questionIds', async () => {
      try {
        await api.post(
          '/questionnaires',
          {
            title: 'Empty Questions',
            categoryId: seedCategoryId,
            levelId: seedLevelId,
            questionIds: [],
          },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
      }
    });
  });

  describe('PUT /questionnaires/:id', () => {
    it('should update questionnaire title as admin', async () => {
      const res = await api.put(
        `/questionnaires/${createdQuestionnaireId}`,
        { title: 'Updated Test Questionnaire' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.title).toBe('Updated Test Questionnaire');
    });

    it('should publish questionnaire', async () => {
      const res = await api.put(
        `/questionnaires/${createdQuestionnaireId}`,
        { published: true },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.published).toBe(true);
    });

    it('should unpublish questionnaire', async () => {
      const res = await api.put(
        `/questionnaires/${createdQuestionnaireId}`,
        { published: false },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.published).toBe(false);
    });

    it('should reject update by non-admin user', async () => {
      try {
        await api.put(
          `/questionnaires/${createdQuestionnaireId}`,
          { title: 'Hacked Title' },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should return 404 for non-existent questionnaire', async () => {
      try {
        await api.put(
          '/questionnaires/99999',
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

  describe('DELETE /questionnaires/:id', () => {
    it('should reject deletion by non-admin user', async () => {
      try {
        await api.delete(`/questionnaires/${createdQuestionnaireId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
        expect(err.response.data.code).toBe('FORBIDDEN');
      }
    });

    it('should delete questionnaire as admin', async () => {
      const res = await api.delete(`/questionnaires/${createdQuestionnaireId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should return 404 when deleting non-existent questionnaire', async () => {
      try {
        await api.delete('/questionnaires/99999', {
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
        await api.get(`/questionnaires/${createdQuestionnaireId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
      }
    });
  });
});
