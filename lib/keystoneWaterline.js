var Waterline = require('waterline');
var sailsMongoAdapter = require('sails-mongo');
var _ = require('lodash');

var _waterline = new Waterline();
var USE_MONGOOSE = 0;

var Document = function(){

};

var waterlineAdaptor = {
  connect: function(mongoUri){
    var waterlineConfig = {
      adapters: {
        'mongo': sailsMongoAdapter
      },
      defaults: {
        migrate: 'safe',
      },
      connections: {
        default: {
          adapter: 'mongo',
          url: mongoUri,
        }
      }
    };
    _waterline.initialize(waterlineConfig, (err, waterlineInstance) => {
      this.waterlineInstance = waterlineInstance;
      console.log(err || 'connected with waterline');
      if (err) {
        this.connection.runCallback('error');
      } else {
        this.connection.runCallback('open');
      }
    });
  },

  connection: {
    runCallback: function(name){
      var once = this.callbacks.once[name];
      var on = this.callbacks.on[name];
      if (typeof once === 'function') {
        once();
        delete this.callbacks.once[name];
      } else if (typeof on === 'function') {
        on();
      }
    },
    callbacks: {
      on: {},
      once: {},
    },
    on: function(name, callback){
      this.callbacks.on[name] = callback;
      return this;
    },
    once: function(name, callback){
      this.callbacks.once[name] = callback;
      return this;
    },
  },

  Schema: function(fields, options){
    return {
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
    };
  },

  _models: {},

  model: function(originalKey, schema){
    if (this.waterlineInstance){
      throw new Error('Attempted to create model `'+originalKey+'` after initializing Waterline.');
    }
    if (typeof schema === 'object'){
      var collectionName = schema.options.collection || originalKey.toLowerCase();
      var module = this;
      var attributes = {};

      var getCollection = function(){
        return module.waterlineInstance.collections[collectionName];
      };

      var extendDocument = function(doc){
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
      };

      _.extend(attributes, schema._virtuals);
      _waterline.loadCollection(Waterline.Collection.extend({
        identity: collectionName,
        connection: 'default',
        attributes: attributes,
      }));

      var model = {
        schema: schema,
        findOne: function(search){
          var query = getCollection().findOne(search);
          // override exec() to extend result before run user's exec()
          return _.extend({}, query, {
            exec: function(callback){
              query.exec(function(err, doc) {
                extendDocument(doc);
                callback(err, doc);
              });
            }
          });
        },
        findById: function(id){
          return this.findOne({id: id});
        },
        count: function(search){
          search = search || {};
          return getCollection().count(search);
        },
      };
      this._models[originalKey] = model;
      console.log('model `%s` created', originalKey);
      return model;

    }else{
      var model = this._models[originalKey];
      if (typeof model === 'object'){
        console.log('model `%s` accessed', originalKey);
        return model;
      }else{
        throw new Error('Model '+originalKey+' was referenced before being initialized.')
      }
    }
  },
};

waterlineAdaptor.Schema.Types = {
  ObjectId: {},
};

module.exports = USE_MONGOOSE ? require('mongoose') : waterlineAdaptor;
