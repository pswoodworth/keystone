var _ = require('lodash');

var Schema = function(fields, options){
  // constructor invoked as `new Schema(fields, options)`
  _.extend(this, {
    nested: {},
    virtuals: {},
    methods: {},
    options: options || {},
    path: function(){},
    pre: function(){},
    post: function(){},
    add: function(object, prefix){
      _.extend(this._fields, object);
    },
    virtual: function(name){
      var schema = this;
      return {
        get: function(getter){
          var virtual = {};
          virtual[name] = getter;
          _.extend(schema._virtuals, virtual);
        },
        set: function(setter){},
      };
    },
    method: function(){
      return {
        // get: function(){},
        // set: function(){},
      };
    },
    // waterline only
    _fields: fields,
    _virtuals: {},
  });
};

module.exports = {
  Schema: Schema,
};
