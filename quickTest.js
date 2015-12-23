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
    var query = User.model.find({email: /user/});
    query.count((err, count)=>{
        console.log('query.count()', count);
      })
      .limit(1)
      .exec((err, users)=>{
        console.log('# Users:', users.length);
        var user = users[0];
        user._.password.compare('admin', function(err, isMatch) {
          console.log(isMatch ? 'Password matches' : 'Incorrect password');
          if (err) {
            throw err;
          } else {
            // all went well; quick the process so the port doesn't stay open
            throw '~ OK. Shutting down. ~';
          }
        });
      });
  },
});
