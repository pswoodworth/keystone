var Waterline = require('waterline');
var sailsMongoAdapter = require('sails-mongo');
var _ = require('lodash');

var waterlinerQuery = require('./query');
var waterlinerSchema = require('./schema');

var _waterline = new Waterline();
var USE_MONGOOSE = 0;

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

  Schema: waterlinerSchema.Schema,

  _models: {},

  model: function(originalKey, schema){
    if (typeof schema === 'object'){
      // model() used as setter

      if (this.waterlineInstance){
        throw new Error('Attempted to create model `'+originalKey+'` after initializing Waterline.');
      }

      var collectionName = schema.options.collection || originalKey.toLowerCase();
      var module = this;
      var attributes = {};

      var getCollection = function(){
        return module.waterlineInstance.collections[collectionName];
      };

      _.extend(attributes, schema._virtuals);
      _waterline.loadCollection(Waterline.Collection.extend({
        identity: collectionName,
        connection: 'default',
        attributes: attributes,
      }));

      var model = {
        schema: schema,
        find: function(criteria){
          criteria = criteria || {};
          var query = getCollection().find(criteria);
          return waterlinerQuery.createQuery(query, this, criteria, schema);
        },
        findOne: function(criteria){
          var query = getCollection().findOne(criteria);
          return waterlinerQuery.createQuery(query, this, criteria, schema);
        },
        findById: function(id){
          return this.findOne({id: id});
        },
        count: function(criteria, callback){
          criteria = criteria || {};
          return getCollection().count(criteria);
        },
      };

      this._models[originalKey] = model;
      console.log('model `%s` created', originalKey);
      return model;

    }else{
      // model() used as getter
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
