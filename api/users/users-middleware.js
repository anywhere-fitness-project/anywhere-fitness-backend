const yup = require('yup')
const db = require('../../data/db-config')
const User = require('./users-model')

const userSchema = yup.object().shape({
    username: yup
        .string()
        .strict(true)
        .trim()
        .required('username is required'),
    password: yup
        .string()
        .strict(true)
        .trim()
        .required('pw is required'),
    role: yup
        .string()
        .strict(true)
})

async function validatePayload(req, res, next) {
    try {
        let validated = await userSchema.validate(req.body)
        if (validated.role === 'makemesuperman') {
            validated.role_id = 1
            req.body = validated
            next()
        } else {
            validated.role_id = 2
            req.body = validated
            next()
        }
    } catch (err) {
        next({
            status: 400,
            message: err.message
        })
    }
}

async function checkUsernameUnique(req, res, next) {
    const { username } = req.body
    const exist = await User.findBy({ username }).first()
    if (exist) {
        next({
            status: 400,
            message: 'username taken'
        })
    } else {
        next()
    }
}

async function checkRoleId(req, res, next) {
    let { role_id } = req.body
    if (!role_id) {
        req.body.role_id = 2
        next()
    } else {
        if (await User.findBy({ role_id }).first()) {
            next()
        } else {
            next({
                status: 400,
                message: 'role_id not exists'
            })
        }
    }
}

async function checkUsernameExist(req, res, next) {
    const { username } = req.body
    const exist = await User.findBy({ username }).first()
    if (!exist) {
        next({
            status: 400,
            message: 'username Not Found'
        })
    } else {
        next()
    }
}

function getRole(user_id) {
    return db('users as u')
        .leftJoin('roles as r', 'u.role_id', 'r.role_id')
        .select('r.role_name')
        .where('u.user_id', user_id)
        .first()
}

async function checkIfBooked(req, res, next) {
    try {
        const { username } = req.params
        const { class_id } = req.body
        const userBookings = await User.findBookings(username)
        const booked = userBookings.bookings.filter(b => b.class_id === class_id)
        if (booked.length === 0) {
            next()
        } else (next({
            status: 400,
            message: 'You already booked this class'
        }))
    } catch (err) { next }

}


module.exports = {
    checkUsernameUnique,
    validatePayload,
    checkUsernameExist,
    getRole,
    checkIfBooked
}
