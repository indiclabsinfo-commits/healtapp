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

describe('Categories API', () => {
  describe('GET /categories', () => {
    it('should list categories with levels', async () => {
      const res = await api.get('/categories', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeGreaterThan(0);
      // Should include levels
      expect(res.data.data[0].levels).toBeDefined();
    });
  });

  describe('POST /categories', () => {
    const testCatName = `Test Category ${Date.now()}`;

    it('should create category (admin)', async () => {
      const res = await api.post('/categories', {
        name: testCatName,
        description: 'A test category',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(201);
      expect(res.data.data.name).toBe(testCatName);
    });

    it('should reject duplicate name', async () => {
      try {
        await api.post('/categories', {
          name: testCatName,
        }, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(409);
        expect(err.response.data.code).toBe('DUPLICATE_NAME');
      }
    });

    it('should reject non-admin', async () => {
      try {
        await api.post('/categories', { name: 'Unauthorized' }, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(403);
      }
    });
  });
});

describe('Levels API', () => {
  let testCategoryId: number;

  beforeAll(async () => {
    const res = await api.get('/categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    testCategoryId = res.data.data[0].id;
  });

  describe('GET /categories/:id/levels', () => {
    it('should list levels for category', async () => {
      const res = await api.get(`/categories/${testCategoryId}/levels`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('POST /levels', () => {
    it('should create level (admin)', async () => {
      const res = await api.post('/levels', {
        name: 'Test Level',
        order: 99,
        categoryId: testCategoryId,
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(201);
      expect(res.data.data.name).toBe('Test Level');

      // Clean up
      await api.delete(`/levels/${res.data.data.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should reject duplicate order in same category', async () => {
      const createRes = await api.post('/levels', {
        name: 'Order Test',
        order: 98,
        categoryId: testCategoryId,
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      try {
        await api.post('/levels', {
          name: 'Duplicate Order',
          order: 98,
          categoryId: testCategoryId,
        }, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(409);
        expect(err.response.data.code).toBe('DUPLICATE_ORDER');
      }

      // Clean up
      await api.delete(`/levels/${createRes.data.data.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });
});

describe('Questions API', () => {
  let testLevelId: number;

  beforeAll(async () => {
    const catRes = await api.get('/categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const firstCategory = catRes.data.data[0];
    testLevelId = firstCategory.levels[0].id;
  });

  describe('GET /levels/:id/questions', () => {
    it('should list questions for level', async () => {
      const res = await api.get(`/levels/${testLevelId}/questions`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe('POST /questions', () => {
    it('should create question (admin)', async () => {
      const res = await api.post('/questions', {
        text: 'Is this a test question?',
        type: 'YESNO',
        options: { yes: 'Yes', no: 'No' },
        levelId: testLevelId,
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(201);
      expect(res.data.data.text).toBe('Is this a test question?');

      // Clean up
      await api.delete(`/questions/${res.data.data.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });
});
