const router = require('express').Router();
const db = require('../../data/dbConfig');

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { checkValid, checkTaken } = require('./auth-midware')
const { JWT_SECRET, BCRYPT_ROUNDS } = require('../../config/config')

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  }
  const options = {
    expiresIn: '1d'
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

router.post('/register', checkValid, checkTaken, async (req, res, next) => {
  try {
    const { username, password } = req.body

    const hash = await bcrypt.hashSync(password, BCRYPT_ROUNDS)

    const newUser = {
      username: username,
      password: hash,
    };

    const userId = await db('users').insert(newUser)
    const [user] = await db('users').where('id', userId)

    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
});

router.post('/login', checkValid, async (req, res, next) => {
  try {
    const { username, password } = req.body
    
    const user = await db('users').where('username', username).first()

    if(user && bcrypt.compareSync(password, user.password)) {
      const token = generateToken(user);
      res.status(200).json({
        message: `welcome, ${username}`,
        token: token
      })
    } else {
      next({ status: 401, message: 'invalid credentials' })
    }
  } catch (err) {
    next(err)
  }
});

module.exports = router;
