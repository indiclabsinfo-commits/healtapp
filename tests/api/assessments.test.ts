import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { testAdmin, testUser, API_BASE } from '../fixtures/test-data';

const api = axios.create({ baseURL: API_BASE });

let adminToken = '';
let userToken = '';
let publishedQuestionnaireId = 0;
let questionnaireQuestions: any[] = [];
let createdAssessmentId = 0;

beforeAll(async () => {
  const adminRes = await api.post('/auth/login', testAdmin);
  adminToken = adminRes.data.data.accessToken;

  const userRes = await api.post('/auth/login', testUser);
  userToken = userRes.data.data.accessToken;

  // Find a published questionnaire to submit an assessment against
  const qRes = await api.get('/questionnaires?published=true', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  expect(qRes.data.data.length).toBeGreaterThan(0);
  publishedQuestionnaireId = qRes.data.data[0].id;

  // Get questionnaire details with questions
  const detailRes = await api.get(`/questionnaires/${publishedQuestionnaireId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  questionnaireQuestions = detailRes.data.data.questions;
});

describe('Assessments API', () => {
  describe('POST /assessments', () => {
    it('should submit assessment with answers', async () => {
      // Build answers for each question based on type
      const answers = questionnaireQuestions.map((q: any) => {
        let answer: any;
        if (q.type === 'MCQ') {
          answer = 0; // First option
        } else if (q.type === 'SCALE') {
          answer = 5; // Mid-range
        } else if (q.type === 'YESNO') {
          answer = true;
        }
        return { questionId: q.id, answer };
      });

      const res = await api.post(
        '/assessments',
        {
          questionnaireId: publishedQuestionnaireId,
          answers,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.score).toBeDefined();
      expect(typeof res.data.data.score).toBe('number');
      expect(res.data.data.questionnaireId).toBe(publishedQuestionnaireId);
      expect(res.data.data.questionnaire).toBeDefined();
      expect(res.data.data.questionnaire.title).toBeDefined();
      createdAssessmentId = res.data.data.id;
    });

    it('should calculate a score between 0 and 100', async () => {
      const answers = questionnaireQuestions.map((q: any) => {
        let answer: any;
        if (q.type === 'MCQ') answer = 0;
        else if (q.type === 'SCALE') answer = 10; // Max
        else if (q.type === 'YESNO') answer = true;
        return { questionId: q.id, answer };
      });

      const res = await api.post(
        '/assessments',
        {
          questionnaireId: publishedQuestionnaireId,
          answers,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data.data.score).toBeGreaterThanOrEqual(0);
      expect(res.data.data.score).toBeLessThanOrEqual(100);
    });

    it('should reject assessment for non-existent questionnaire', async () => {
      try {
        await api.post(
          '/assessments',
          {
            questionnaireId: 99999,
            answers: [{ questionId: 1, answer: 0 }],
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });

    it('should reject assessment with empty answers', async () => {
      try {
        await api.post(
          '/assessments',
          {
            questionnaireId: publishedQuestionnaireId,
            answers: [],
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject unauthenticated submission', async () => {
      try {
        await api.post('/assessments', {
          questionnaireId: publishedQuestionnaireId,
          answers: [{ questionId: 1, answer: 0 }],
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });

    it('should reject missing questionnaireId', async () => {
      try {
        await api.post(
          '/assessments',
          {
            answers: [{ questionId: 1, answer: 0 }],
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('GET /assessments/my', () => {
    it('should return user assessment history', async () => {
      const res = await api.get('/assessments/my', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
      expect(res.data.pagination).toBeDefined();
      expect(res.data.pagination.total).toBeGreaterThan(0);
    });

    it('should include questionnaire info in each assessment', async () => {
      const res = await api.get('/assessments/my', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      const assessment = res.data.data[0];
      expect(assessment.questionnaire).toBeDefined();
      expect(assessment.questionnaire.title).toBeDefined();
      expect(assessment.score).toBeDefined();
      expect(assessment.completedAt).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await api.get('/assessments/my?page=1&limit=1', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(1);
      expect(res.data.pagination.page).toBe(1);
      expect(res.data.pagination.limit).toBe(1);
    });

    it('should reject unauthenticated request', async () => {
      try {
        await api.get('/assessments/my');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });
  });

  describe('GET /assessments/my/:id', () => {
    it('should get single assessment by ID', async () => {
      const res = await api.get(`/assessments/my/${createdAssessmentId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBe(createdAssessmentId);
      expect(res.data.data.score).toBeDefined();
      expect(res.data.data.answers).toBeDefined();
      expect(res.data.data.questionnaire).toBeDefined();
      expect(res.data.data.questionnaire.title).toBeDefined();
    });

    it('should return 404 for non-existent assessment', async () => {
      try {
        await api.get('/assessments/my/99999', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(404);
        expect(err.response.data.code).toBe('NOT_FOUND');
      }
    });

    it('should not return another user assessment', async () => {
      // Admin tries to access user's assessment via the user endpoint
      try {
        await api.get(`/assessments/my/${createdAssessmentId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        // Admin did not create this assessment so it should be 404
        expect(err.response.status).toBe(404);
      }
    });

    it('should return 400 for invalid ID', async () => {
      try {
        await api.get('/assessments/my/abc', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.code).toBe('INVALID_ID');
      }
    });
  });
});
