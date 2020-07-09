require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const BookmarkServices = require('./bookmarks-services')
const app = express()
const jsonParser = express.json()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

app.get('/bookmarks', (req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarkServices.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            res.json(bookmarks)
        })
        .catch(next)
})

app.post('/bookmarks', jsonParser, (req, res, next) => {
    const { title, url, description } = req.body
    let rating
    if(!req.body.rating){
        rating = 1
    }
    else {
        rating = req.body.rating
    }
    const newBookmark = { title, url, description, rating }
    BookmarkServices.insertBookmark(
        req.app.get('db'),
        newBookmark
    )
        .then(bookmark => {
            res
                .status(201)
                .location(`/bookmarks/${bookmark.id}`)
                .json(bookmark)
        })
        .catch(next)
})

app.get('/bookmarks/:bookmark_id', (req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarkServices.getById(knexInstance, req.params.bookmark_id)
        .then(bookmark => {
            if (!bookmark) {
                return res.status(404).json({
                    error: { message: `bookmark doesn't exist` }
                })
            }
            res.json(bookmark)
        })
        .catch(next)
})


app.get('/', (req, res) => {
    res.send('Hello, boilerplate!')
})

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app