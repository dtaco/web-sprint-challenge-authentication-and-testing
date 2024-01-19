const db = require('../data/dbConfig')
const request = require('supertest')
const server = require('./server')

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
})

beforeEach(async () => {
  await db('users').truncate()
})

const user1 = { username: "user", password: '1234'}

describe('[POST] /auth/register', () => {

  test('new user can be added', async () => {
    await request(server).post('/api/auth/register').send(user1)

    const users = await db('users')

    expect(users).toHaveLength(1)
  })

  test('resolves to username and password(hashed)', async () => {
   const newUser = await request(server).post('/api/auth/register').send(user1)  

    expect(newUser.body.username).toMatch(user1.username)
    expect(newUser.body.password).not.toMatch(user1.password)
  })
})

describe('[GET] /jokes', () => {

  test('resolves to error with no token', async () => {
    await request(server).post('/api/auth/register').send(user1)
    await request(server).post('/api/auth/login').send(user1)

    const result = await request(server).get('/api/jokes')
    
    expect(result.body.message).toBe('token required')
  })

  test('resolves to a list of jokes when authorized', async () => {
    await request(server).post('/api/auth/register').send(user1)

    const result = await request(server).post('/api/auth/login').send(user1)
    const jokes = await request(server).get('/api/jokes').set('Authorization', `${result.body.token}`)

    expect(jokes.body).toHaveLength(3)
  })
})

describe('[POST] /auth/login', () => {
  test('token is added when logged in', async () => {
    await request(server).post('/api/auth/register').send(user1)
    const result = await request(server).post('/api/auth/login').send(user1)

    expect(result.body.token).toBeTruthy()
  })

  test('bad username or password resolves to an error', async () => {
    await request(server).post('/api/auth/register').send(user1)
    const result = await request(server).post('/api/auth/login').send({...user1, password: '123'})
    
    expect(result.body.message).toBe('invalid credentials')
  })
})
