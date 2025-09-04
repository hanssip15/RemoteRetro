const { v4: uuidv4 } = require("uuid");

module.exports = {
  setIds: function (context, events, done) {
    context.vars.roomId = uuidv4(); // UUID unik untuk setiap room
    context.vars.userId = uuidv4(); // UUID unik untuk setiap user
    return done();
  },
};
