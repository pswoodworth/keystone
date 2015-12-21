var Waterline = require('waterline');
var sailsMongoAdapter = require('sails-mongo');

var _waterline = new Waterline();
var USE_MONGOOSE = false;

var waterlineAdaptor = {
  connect: function(mongoUri){
    console.log('connect()', mongoUri);
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
      console.log(err || 'connected with waterline')
    });
  },

  connection: {
    on: function(name, callback){
      if (name !== 'error') {
        callback();
      }
      return this;
    },
    once: function(name, callback){
      if (name !== 'error') {
        callback();
      }
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
      add: function(){},
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
