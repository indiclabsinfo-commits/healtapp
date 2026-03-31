import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { testAdmin, testUser, API_BASE } from '../fixtures/test-data';

const api = axios.create({ baseURL: API_BASE });

let userToken = '';

beforeAll(async () => {
  const userRes = await api.post('/auth/login', testUser);
  userToken = userRes.data.data.accessToken;
});

describe('Mood API', () => {
  describe('POST /mood', () => {
    it('should log mood with value 1', async () => {
      const res = await api.post(
        '/mood',
        { mood: 1 },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.mood).toBe(1);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.userId).toBeDefined();
      expect(res.data.data.date).toBeDefined();
    });

    it('should log mood with value 3', async () => {
      const res = await api.post(
        '/mood',
        { mood: 3 },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.data.mood).toBe(3);
    });

    it('should log mood with value 5', async () => {
      const res = await api.post(
        '/mood',
        { mood: 5 },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.data.mood).toBe(5);
    });

    it('should reject mood value 0 (below minimum)', async () => {
      try {
        await api.post(
          '/mood',
          { mood: 0 },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject mood value 6 (above maximum)', async () => {
      try {
        await api.post(
          '/mood',
          { mood: 6 },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject negative mood value', async () => {
      try {
        await api.post(
          '/mood',
          { mood: -1 },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject non-integer mood value', async () => {
      try {
        await api.post(
          '/mood',
          { mood: 2.5 },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject missing mood value', async () => {
      try {
        await api.post(
          '/mood',
          {},
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject string mood value', async () => {
      try {
        await api.post(
          '/mood',
          { mood: 'happy' },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject unauthenticated request', async () => {
      try {
        await api.post('/mood', { mood: 3 });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('GET /mood/history', () => {
    it('should return mood history', async () => {
      const res = await api.get('/mood/history', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
    });

    it('should return entries with correct structure', async () => {
      const res = await api.get('/mood/history', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      const entry = res.data.data[0];
      expect(entry.id).toBeDefined();
      expect(entry.mood).toBeDefined();
      expect(entry.mood).toBeGreaterThanOrEqual(1);
      expect(entry.mood).toBeLessThanOrEqual(5);
      expect(entry.date).toBeDefined();
    });

    it('should return entries in descending date order', async () => {
      const res = await api.get('/mood/history', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      const dates = res.data.data.map((e: any) => new Date(e.date).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should filter by days parameter', async () => {
      const res = await api.get('/mood/history?days=7', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      res.data.data.forEach((entry: any) => {
        const entryDate = new Date(entry.date);
        expect(entryDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
      });
    });

    it('should use default 30 days when no days param', async () => {
      const res = await api.get('/mood/history', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      res.data.data.forEach((entry: any) => {
        const entryDate = new Date(entry.date);
        expect(entryDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      });
    });

    it('should reject unauthenticated request', async () => {
      try {
        await api.get('/mood/history');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });
});
