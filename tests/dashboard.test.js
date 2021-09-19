/**
 * Server test scenarios about dashboard
 */

const request = require('supertest');
const app = require('../src/app');
const { userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should open up dashboard', async () => {
    await request(app)
        .get('/dashboard')
        .set('Cookie', [`auth_token=${userOne.tokens[0].token}`])
        .send()
        .expect(200);
});

test('Should not open up dashboard if unauthenticated', async () => {
    await request(app)
        .get('/dashboard')
        .send()
        .expect(401);
});

test('Should open up tag search result', async () => {
    await request(app)
        .get('/dashboard/search')
        .set('Cookie', [`auth_token=${userOne.tokens[0].token}`])
        .send()
        .expect(200);
});

test('Should not open up tag search result if unauthenticated', async () => {
    await request(app)
        .get('/dashboard/search')
        .send()
        .expect(401);
});