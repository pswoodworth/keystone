var Waterline = require('waterline');
var sailsMongoAdapter = require('sails-mongo');
var _ = require('lodash');

var _waterline = new Waterline();
var USE_MONGOOSE = false;


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
      this.connection.runCallback('open');
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
        console.log('add()', object)
        this._fields = _.extend(this._fields, object);
      },
      virtual: function(){
        return {
          get: function(){},
          set: function(){},
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
    };
  },

  model: function(originalKey, schema){
    var collectionName = schema.options.collection || originalKey.toLowerCase();
    var module = this;
    _waterline.loadCollection(Waterline.Collection.extend({
      identity: collectionName,
      connection: 'default'
    }));
    var getCollection = function(){
      return module.waterlineInstance.collections[collectionName];
    };
    return {
      schema: schema,
      findOne: function(query){
        console.log('findOne()', query);
        return getCollection().findOne(query);
      },
      findById: function(id){
        return this.findOne({id: id});;
      },
    };
  },
};

waterlineAdaptor.Schema.Types = {
  ObjectId: {},
};

module.exports = USE_MONGOOSE ? require('mongoose') : waterlineAdaptor;
