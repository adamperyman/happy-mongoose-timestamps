import { MONGO_OPERATORS } from '../constants'

const {
  SET_OPERATOR,
  SET_ON_INSERT_OPERATOR
} = MONGO_OPERATORS

/**
 * Gets all fields nested inside the current update operation's operator ($set/$setOnInsert).
 *
 * @param {Object} updateOperation - The current update operation.
 * @param {String} operator - The operator of which to check for fields to be updated.
 *
 * @returns {Object} All fields to be updated with the given operator.
 *
 * Example:
 *
 * updateOperation = {
 *   $set: {
 *     foo: 'bar'
 *   }
 * }
 *
 * operator = '$set'
 *
 * return {
 *   foo: 'bar'
 * }
 */
export const getUpdateFields = (updateOperation, operator) => {
  if (!updateOperation) {
    throw new Error('updateOperation is undefined.')
  }

  if (!operator) {
    throw new Error(`operator is undefined. Expected ${SET_OPERATOR} or ${SET_ON_INSERT_OPERATOR}.`)
  }

  return updateOperation[operator]
}

/**
 * Determines whether any of the fields in the current operation exist in the given blacklist.
 *
 * @param {Array} blacklist=[] - List of fields which should NOT trigger any hooks.
 * @param {Object} fieldsToCheck={} - All fields in the current operation to check against the blacklist.
 *
 * @returns {Boolean} Whether or not any of the fields in the current operation are blacklisted.
 */
export const blacklistedFieldExists = (blacklist = [], fieldsToCheck = {}) => {
  if (!blacklist.length || !Object.keys(fieldsToCheck).length) {
    return false
  }

  const blacklistDoesApply = Object.keys(fieldsToCheck)
    .some(field => fieldIsBlacklisted(blacklist, field))

  return blacklistDoesApply
}

/**
 * Recursively checks for fields (nested or otherwise) that exist in the given blacklist.
 *
 * @param {Array} blacklist=[] - List of fields which should NOT trigger any hooks.
 * @param {String} field - The current field to check against the blacklist.
 *
 * @returns {Boolean} Whether or not the given field exists in the blacklist.
 *
 * Example:
 *
 * blacklist = [ 'foo' ]
 * field = 'foo.bar'
 *
 * 'foo.bar' is not explicitly blacklisted, however 'foo', the parent object of 'bar' IS.
 *
 * Therefore fieldIsBlacklisted returns true.
 */
const fieldIsBlacklisted = (blacklist = [], field) => {
  if (!field || !field.length) {
    return false
  }

  const blacklistDoesApply = blacklist.indexOf(field) >= 0

  if (blacklistDoesApply) {
    return true
  }

  // Get and pop the last element, e.g. 'foo.bar' becomes ['foo', 'bar'] which becomes 'foo'.
  const newPath = field.split('.')
  newPath.splice(-1, 1)
  const newField = newPath.join('.')

  return fieldIsBlacklisted(blacklist, newField)
}
