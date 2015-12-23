var _ = require('lodash');

var createQuery = function(waterlineQuery, model, criteria, schema){
  // return an extended version of a waterline query
  return _.extend(_.create(waterlineQuery, waterlineQuery), {
    count: function(callback){
      model.count(criteria, callback).exec(callback);
      return this;
    },
    find: function(criteria, callback){
      // TODO: see if needed
      return this;
    },
    // override exec() to extend result before run user's exec()
    exec: function(callback){
      waterlineQuery.exec(function(err, result) {
        var final;
        if (_.isArray(result)) {
          final = result.map(doc => extendDocument(doc, schema));
        } else {
          final = extendDocument(result, schema);
        }
        callback(err, final);
      });
    }
  });
};

var extendDocument = function(doc, schema){
  if (!doc) return;
  // mongoose document get() method
  doc.get = function(path){
    return _.get(doc, path);
  };
  // mongoose expects virtuals to be values, not functions
  // so we replace each virtual key with the result of the function
  _.extend(doc, _.mapValues(schema._virtuals, function(virtual){
    return virtual.call(doc);
  }));

  // the list virtual creates a self-referencing Object.
  // waterline chokes on it when using node's util.inspect() (waterline/lib/waterline/model/lib/model.js:73)
  delete doc.list;
  return doc;
};

module.exports = {
  createQuery: createQuery,
};


/*
  query <-- module, schema, criteria
*/
