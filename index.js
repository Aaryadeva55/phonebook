require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()
const cors = require('cors')
const Person = require('./models/person')

app.use(cors())

app.use(express.static('dist'))

app.use(morgan('tiny', {
    skip: (req, res) => {return req.method === 'POST'}
}))

let persons = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]

app.use(express.json())

morgan.token('content', (request) => {
    return JSON.stringify(request.body)
})

app.get('/api/persons', (request, response, next) => {
    Person.find({}).then(people => {
        response.json(people)
    }).catch(error => next(error))
})

app.get('/info', (request, response) => {
    const time = String(new Date())
    Person.find({}).then(person => {
        response.send(`<p>Phonebook has info for ${person.length} people</p><p>${time}</p>`)
    })
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id).then(person => {
        res.json(person)
    }).catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    const id = req.params.id
    Person.findByIdAndDelete(id).then(result => {
        res.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id).then(person => {
        if (!person) {
            return res.status(404).end()
        }

        person.number = req.body.number

        return person.save().then(updatedPerson => {
            res.json(updatedPerson)
        })
    }).catch(error => next(error))
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :content'))

app.post('/api/persons', (req, res, next) => {
    const body = req.body

    if (!body.name) {
        return res.status(400).json({
            error: 'Name missing'
        })
    }

    if (!body.number) {
        return res.status(400).json({
            error: 'Number missing'
        })
    }

    if (body.number.length < 8) {
        return res.status(400).json({
            error: 'Phone number must have length of 8 or more'
        })
    }

    Person.find({name: body.name}).then(result => {
        if (result.length > 0) {
            return Promise.reject('DUPLICATE')
        }

        const person = new Person({
            name: body.name,
            number: body.number
        })

        return person.save()
    }).then(savedPerson => {
        res.json(savedPerson)
    }).catch(error => next(error))
})

const errorHandler = (error, req, res, next) => {
    if (error.name === 'CastError') {
        return res.status(400).send({ error: 'malformmated id' })
    } else if (error.name === 'ValidationError') {
        return res.status(400).send( {error: error.message} )
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})