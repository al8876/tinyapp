const http = require("http");
const PORT = 8080;

// a function to create random string of 6 characters
function generateRandomString() {
  var string = '';
  var possible = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";

  for (var i = 0; i < 6; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));

  return string;
}


// a function which handles requests and sends response
function requestHandler(request, response) {
  if (request.url == '/') {
    response.end('Welcome!');
  } else if (request.url == "/urls") {
    response.end('www.lighthouselabs.ca\nwww.google.com');
  } else {
    response.statusCode = 404;
    response.end("Unknown Path");
  }
}

var server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Server listening on: http://localhost:${PORT}`);
});