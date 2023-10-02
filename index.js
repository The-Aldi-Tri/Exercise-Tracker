const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/index.html'))
})

// -------------------------------MY CODE--------------------------------//
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

const mongoose = require('mongoose')
const MONGO_URI = process.env.MONGO_URI
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({ username: { type: String, required: true } })
const User = mongoose.models.User || mongoose.model('User', userSchema)

const exerciseSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: Date
  }
)
const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema)

app.post('/api/users', async (req, res) => {
  const username = req.body.username
  const found = await User.findOne({ username }, { __v: 0 })
  if (found) {
    return res.status(200).json(found)
  } else {
    const newUser = new User({ username })
    try {
      await newUser.save().then(savedDoc => {
        const obj = {
          _id: savedDoc._id,
          username: savedDoc.username
        }
        return res.status(200).json(obj)
      })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    };
  };
})

app.get('/api/users', async (req, res) => {
  const allUser = await User.find({}, { __v: 0 })
  return res.status(200).json(allUser)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.body[':_id'] || req.params._id
  const found = await User.findOne({ _id: id }, { __v: 0 })
  if (!found) {
    return res.status(404).json({ error: 'id not exist' })
  } else {
    const desc = req.body.description
    const dura = req.body.duration
    let date = req.body.date
    if (String(new Date(date)) === 'Invalid Date') {
      date = new Date()
    } else {
      date = new Date(date)
    }
    const newExer = new Exercise({ userId: found._id, description: desc, duration: dura, date })
    try {
      await newExer.save().then(savedDoc => {
        const obj = {
          _id: found._id,
          username: found.username,
          description: savedDoc.description,
          duration: savedDoc.duration,
          date: savedDoc.date.toDateString()
        }
        return res.status(200).json(obj)
      })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    };
  }
})

app.get('/api/users/:_id/logs?', async (req, res) => {
  const id = req.params._id
  const found = await User.findOne({ _id: id }, { __v: 0 })
  if (!found) {
    return res.status(404).json({ error: 'id not exist' })
  } else {
    let from = req.query.from
    if (from !== undefined && String(new Date(from)) !== 'Invalid Date') {
      from = new Date(from)
    } else {
      from = new Date('0000')
    }

    let to = req.query.to
    if (to !== undefined && String(new Date(to)) !== 'Invalid Date') {
      to = new Date(to)
    } else {
      to = new Date()
    }

    const limit = req.query.limit

    let logs = await Exercise.find(
      { userId: found._id, date: { $gte: from, $lte: to } }, { _id: 0, userId: 0, __v: 0 })
      .sort({ date: -1 })
      .limit(Number(limit) || 0)

    logs = logs.map((log) => {
      return {
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString()
      }
    })

    const obj = {
      _id: found._id,
      username: found.username,
      count: logs.length,
      log: logs
    }

    return res.status(200).json(obj)
  }
})

// -------------------------------MY CODE--------------------------------//

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
