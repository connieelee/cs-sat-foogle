const RequestTurtle = require('request-turtle');
const turtle = new RequestTurtle({ limit: 300 }); // limit rate to 300ms. this is the default


for(var i = 0; i < Math.pow(10, 1000); i++) {
  turtle.request({ method: "POST", uri: 'http://foo.org' })
    .then(function(responseBody) {
      // safely make all requests
    });
}
