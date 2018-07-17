import get from 'lodash/get'

const $schema = Symbol('schema')
const $createdAt = Symbol('createdAt')
const $updatedAt = Symbol('updatedAt')

class HappyMongooseTimestamps {
  constructor (schema, options = {}) {
    this[$schema] = schema

    this[$createdAt] = options.createdAt || 'createdAt'
    this[$updatedAt] = options.updatedAt || 'updatedAt'

    this.validateField((this[$schema].path(this[$createdAt])), this[$createdAt])
    this.validateField((this[$schema].path(this[$updatedAt])), this[$updatedAt])
  }

  validateField (schemaType, field) {
    const fieldInstance = get(schemaType, 'instance')

    if (fieldInstance !== 'Date') {
      throw new Error(`${field} must be of type 'Date'.`)
    }
  }

  update () {
    this[$schema].pre('update', this.handleUpdate)
  }

  updateOne () {
    this[$schema].pre('updateOne', this.handleUpdate)
  }

  create () {
    this[$schema].pre('create', this.handleInsert)
  }

  save () {
    this[$schema].pre('save', this.handleInsert)
  }

  handleUpdate () {
    const res = next => {
      const now = new Date()

      this.update({}, {
        $set: {
          [this[$updatedAt]]: now
        },
        $setOnInsert: {
          [this[$createdAt]]: now
        }
      })

      next()
    }

    return res
  }

  handleInsert () {
    const createdAtField = this[$createdAt]
    const updatedAtField = this[$updatedAt]

    const res = next => {
      const now = new Date()

      this[createdAtField] = now
      this[updatedAtField] = now

      next()
    }

    return res
  }
}

export default function (schema, options) {
  const plugin = new HappyMongooseTimestamps(schema, options)

  plugin.update()
  plugin.updateOne()
  plugin.create()
  plugin.save()
}
