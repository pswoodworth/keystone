var _ = require('lodash');

var createQuery = function(waterlineQuery, model, criteria, schema){
  // return an extended version of a waterline query
  var queryObject = {
    count: function(callback){
      model.count(criteria, callback).exec(callback);
      return this;
    },
    limit: function(number){
      waterlineQuery.limit(number);
      return this;
    },
    find: function(criteria, callback){
      // TODO: see if needed
      return this;
    },
    skip: function(number){
      waterlineQuery.skip(number);
      return this;
    },
    sort: function(arg){
      // convert sort arg
      // waterline/mongoose polyglot sortarg: {x: 'desc', y: 'asc'}
      var waterlineSort;
      if (typeof arg === 'string') {
        // e.g. 'w -x -y z'
        waterlineSort = {};
        arg.split(' ').forEach(val => {
          var key, direction;
          if (val[0] === '-') {
            waterlineSort[val.substr(1)] = 'desc';
          } else {
            waterlineSort[val] = 'asc';
          }
        });
      } else {
        // e.g. {x: 'ascending', y: -1, z: 1}
        waterlineSort = _.mapValues(arg, (val) => {
          return _.contains(['asc', 'ascending', '1', 1], val) ? 'asc' : 'desc';
        });
      }
      waterlineQuery.sort(waterlineSort);
      return this;
    },
    // where()...  where(key, value) or (key).eq(val) or (key).in([])
    // select()... 'x y z' --> ['x', 'y', 'z']
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
  };
  ['select', 'equals', 'where', 'populate'].forEach(name => {
    queryObject[name] = function(){
      console.log(`* ${name}() is not implimented yet.
        ARGS: ${_.toArray(arguments).join(' ; ')}`);
      return this;
    };
  });
  return queryObject;
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
