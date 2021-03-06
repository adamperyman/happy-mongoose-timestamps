# happy-mongoose-timestamps
A simple mongoose plugin to support createdAt and updatedAt fields, with blacklist support.

# What?
Add this plugin to any Mongoose schema so that when any document based on the attached schema is updated then that document will have its `updatedAt` field set to the current date.

Also supports the handling of `createdAt` and/or `updatedAt` fields on `.save` operations.

You can blacklist specific fields or entire sub-objects so that they do not trigger the modification of `updatedAt` when documents are updated.

# Installation
```
$ npm i --save happy-mongoose-timestamps
```
or
```
$ yarn add happy-mongoose-timestamps
```

# Options
* `blacklist (default: [])`: Any fields which, when updated, should **NOT** trigger `updatedAt` to be modified.
* `createdAt (default: createdAt)`: Name of the schema field to store the created at value.
* `updatedAt (default: updatedAt)`: Name of the schema field to store the updated at value.
* `shouldUpdateSchema (default: false)`: Whether or not the plugin should add `createdAt` and `updatedAt` fields to the given schema, if they do not already exist.
* `disableSaveHook (default: false)`: Whether or not to disable the pre-save hook functionality.
* `forceCreateHook (default: false)`: Whether or not to force the saveHook if the item is new.
Disabling saveHook will disable the "createHook" since a create action will call saveHook. So if you set `disableSaveHook` to true and `forceCreateHook` to false `createdAt` will never be created and `updatedAt`
will not be set on the creation.
* `disableUpdateHook (default: false)`: Whether or not to disable the pre-update hook functionality.
* `disableUpdateOneHook (default: false)`: Whether or not to disable the pre-updateOne hook functionality.

# Usage
```
import { Schema } from 'mongoose'
import HappyMongooseTimestamps from 'happy-mongoose-timestamps'

const YourSchema = { .. }
const schema = new Schema(YourSchema)

const options = {
  blacklist: ['foo', 'nested.field'], // Any updates containing these fields will not trigger updatedAt to be modified.
  shouldUpdateSchema: true // Will add createdAt and updatedAt fields to the given schema if they do not exist.
}

schema.plugin(HappyMongooseTimestamps, options)
```

---

So, given the blacklist specified above, if the current update operation looks like:

```
$set: {
  'foo': 'bar',
  'bar': 'baz'
}
```

Then `updatedAt` will not be modified as the update operation contains the field: `foo`. To be clear: the fields will still be updated as usual, the only difference is that `updatedAt` will not be modified.

---

The same rule applies for the following scenario:

Given the following update operation:

```
$set: {
  'foo.nested.value': 'bar'
}
```

Again, will not trigger `updatedAt` to be modified as the field `foo` is blacklisted, therefore any fields inside `foo` will not trigger `updatedAt` to be modified.

---

Finally, the following update operation:

```
$set: {
 'bar': 'baz'
}
 ```

 **WILL** trigger `updatedAt` to be modified, as the field `bar` does not exist inside the blacklist.

 ---

# Notes
* The variable name `blacklist` is better than `blackList`.
* Symbols are cool.

# TO DO
* Save hook needs testing and blacklist support.
* Tests.
