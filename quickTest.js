var keystone = require('./index');

keystone.init({

 'name': 'Test Keystone',

 'auto update': true,
 'mongo': 'mongodb://localhost/testkeysone',
 port: 3002,

 'user model': 'User',
 'cookie secret': '(your secret here)'

});

var Types = keystone.Field.Types;

var User = new keystone.List('User');

User.add({
 name: { type: Types.Name, required: true, index: true },
 email: { type: Types.Email, initial: true, required: true, index: true },
 password: { type: Types.Password, initial: true, required: true }
}, 'Permissions', {
 isAdmin: { type: Boolean, label: 'Can access Keystone', index: true }
});

User.register();

keystone.start({
  onStart: () => {
    // test your stuff here
    User.model.findOne({isAdmin: true}).exec(function(err, user){
      console.log(user);
      console.log('_', user._);
      if (err) {
        throw err;
      } else {
        // all went well; quick the process so the port doesn't stay open
        throw '~ OK. Shutting down. ~';
      }
    });
  },
});
