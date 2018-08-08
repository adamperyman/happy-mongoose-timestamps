/**
 * A simple Mongoose plugin to support createdAt and updatedAt fields, with blacklist support.
 *
 * By Adam Peryman <adam.peryman@gmail.com>
 */
import { DATA_FIELDS, MONGO_OPERATORS } from './constants'
import { blacklistedFieldExists, getUpdateFields } from './utils'

const {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_UPDATED_AT_FIELD
} = DATA_FIELDS

const {
  SET_OPERATOR,
  SET_ON_INSERT_OPERATOR
} = MONGO_OPERATORS

const $blacklist = Symbol('blackist')
const $options = Symbol('options')
const $schema = Symbol('schema')

const $createdAt = Symbol('createdAt')
const $updatedAt = Symbol('updatedAt')

/**
 * A simple Mongoose plugin to support createdAt and updatedAt fields, with blacklist support.
 *
 * @param {Object} schema - The given schema of which the plugin should be attached.
 * @param {Object} [options={}] - An object of predefined settings to customize behavior.
 * @param {String} [options.createdAt='createdAt'] - Name of the new createdAt field.
 * @param {String} [options.updatedAt='updatedAt'] - Name of the new updatedAt field.
 * @param {Boolean} [options.shouldUpdateSchema=false] - Will add createdAt and updatedAt fields to the given schema if they do not exist.
 * @param {[String]} [options.blacklist=[]] - Contains an array of field names which will NOT trigger save or update hooks.
 * @param {Boolean} [options.disableSaveHook=false] - Will disable pre hook functionality for SAVE operations.
 * @param {Boolean} [options.disableUpdateHook=false] - Will disable pre hook functionality for UPDATE operations.
 * @param {Boolean} [options.disableUpdateOneHook=false] - Will disable pre hook functionality for updateOne operations.
 */
class HappyMongooseTimestamps {
  constructor (schema, options = {}) {
    if (!schema) {
      throw new Error('Schema is required.')
    }

    this[$schema] = schema
    this[$options] = options

    this[$blacklist] = options.blacklist || []
    this[$createdAt] = options.createdAt || DEFAULT_CREATED_AT_FIELD
    this[$updatedAt] = options.updatedAt || DEFAULT_UPDATED_AT_FIELD

    const shouldUpdateSchema = this[$options].shouldUpdateSchema

    if (shouldUpdateSchema) {
      this.handleUpdateSchema()
    }
  }

  /**
   * Checks to see if createdAt and updatedAt fields exist in the given schema, will create them if they do not.
   */
  handleUpdateSchema () {
    const createdAtFieldExists = !!this[$schema][this[$createdAt]]
    const updateFieldExists = !!this[$schema][this[$updatedAt]]

    if (!createdAtFieldExists) {
      this.updateSchema(this[$createdAt])
    }

    if (!updateFieldExists) {
      this.updateSchema(this[$updatedAt])
    }
  }

  /**
   * Updates the given schema with the new field.
   *
   * @param {String} field - The name of the field to be added to the schema.
   */
  updateSchema (field) {
    if (!field) {
      throw new Error('Failed to update schema, field is undefined.')
    }

    this[$schema].add({
      [field]: Date
    })
  }

  /**
   * Attaches the new save hook to the given schema.
   */
  save () {
    const shouldDisableSaveHook = this[$options]['disableSaveHook']

    if (shouldDisableSaveHook) {
      return
    }

    this[$schema].pre('save', this.getSaveHook())
  }

  /**
   * Attaches the new update hook to the given schema.
   */
  update () {
    const shouldDisableUpdateHook = this[$options]['disableUpdateHook']

    if (shouldDisableUpdateHook) {
      return
    }

    this[$schema].pre('update', this.getUpdateHook())
  }

  /**
   * Attaches the new updateOne hook to the given schema.
   */
  updateOne () {
    const shouldDisableUpdateOneHook = this[$options]['disableUpdateOneHook']

    if (shouldDisableUpdateOneHook) {
      return
    }

    this[$schema].pre('updateOne', this.getUpdateHook())
  }

  /**
   * Generates the function to be executed BEFORE any SAVE operations on the given schema.
   *
   * @returns {Function} Hook function to be applied to any SAVE operations.
   */
  getSaveHook () {
    const createdAtField = this[$createdAt]
    const updatedAtField = this[$updatedAt]

    const saveFunc = function (next) {
      const now = new Date()

      if (this.isNew) {
        this[createdAtField] = now
        this[updatedAtField] = now
      } else {
        this[updatedAtField] = now
      }

      next()
    }

    return saveFunc
  }

  /**
   * Generates the function to be executed BEFORE any UPDATE operations on the given schema.
   *
   * @returns {Function} Hook function to be applied to any UPDATE operations.
   */
  getUpdateHook () {
    const createdAtField = this[$createdAt]
    const updatedAtField = this[$updatedAt]
    const blacklist = this[$blacklist]

    const updateFunc = function (next) {
      const now = new Date()

      const currentUpdateOp = this.getUpdate()
      const currentSetFields = getUpdateFields(currentUpdateOp, SET_OPERATOR)
      const currentSetOnInsertFields = getUpdateFields(currentUpdateOp, SET_ON_INSERT_OPERATOR)

      const setFieldsAreBlacklisted = currentSetFields && blacklistedFieldExists(blacklist, currentSetFields)
      const setOnInsertFieldsAreBlacklisted = currentSetOnInsertFields && blacklistedFieldExists(blacklist, currentSetOnInsertFields)

      if (setFieldsAreBlacklisted || setOnInsertFieldsAreBlacklisted) {
        return next()
      }

      this.update({}, {
        $set: {
          [updatedAtField]: now
        },
        $setOnInsert: {
          [createdAtField]: now,
          [updatedAtField]: now
        }
      })

      return next()
    }

    return updateFunc
  }
}

export default (schema, options) => {
  const plugin = new HappyMongooseTimestamps(schema, options)

  plugin.save()
  plugin.update()
  plugin.updateOne()
}
