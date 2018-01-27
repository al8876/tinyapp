// IMPORTED PACKAGES

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET_KEY || 'dvelopment']
}));

app.set("view engine", "ejs");

// DATA OBJECTS

// Database for URLs
const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "test"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "test"
  }
};

// Database for users
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "e@e.com",
    password: "$2a$12$scoYVH8x7lOTXtL24QEp3OXBExWcgk9tl.IIc2jWFcq4/2bzWxfxK"
  },
  "alex": {
    id: "alex",
    email: "s@s.com",
    password: "$2a$12$scoYVH8x7lOTXtL24QEp3OXBExWcgk9tl.IIc2jWFcq4/2bzWxfxK"
  },
  "test": {
    id: "test",
    email: "t@t.com",
    password: "$2a$12$scoYVH8x7lOTXtL24QEp3OXBExWcgk9tl.IIc2jWFcq4/2bzWxfxK"
  }
};

// HELPER FUNCTIONS

// function to find user using given email
const findByEmail = (email) => {
  for (let key in users) {
    const user = users[key];
    if (user.email === email) {
      return user;
    }
  }
  return false;
};

// function to find user.id using given user ID
const findUserByID = (userID) => {
  for (let key in users) {
    const user = users[key];
    if (user.id === userID) {
      return user.id;
    }
  }
  return false;
};

// function to find user.email given user ID
const findUserEmailByID = (userID) => {
  for (let key in users) {
    const user = users[key];
    if (user.id === userID) {
      return user.email;
    }
  }
  return false;
};

// Function to generate random string for user ID
function generateRandomString() {
  var string = '';
  var possible = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
  for (var i = 0; i < 6; i++) {
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return string;
};

// ROUTES

// home page -> If logged in redirects to /urls to show shortened URLs. Else redirect to login page
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// takes user to create new shortened URL page -> if not logged in, takes to new user page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id)
  };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.render("new_user");
  }
});

// rendered urls_new filters user to show individual shortened URLs using EJS
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id)
  };
  res.render("urls_index", templateVars);
});

// renders login page
app.get('/login', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id)
  };
  res.render('login', templateVars);
});

// Delete URL data from urlDatabase
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// User can delete URL data from urlDatabase if URL belongs to user -> Else returns error
app.get('/urls/:id/delete', (req, res) => {
  let user = req.session.user_id;
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userID === user) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].url,
      user: findUserByID(req.session.user_id),
      userEmail: findUserEmailByID(req.session.user_id),
      urlDatabase: urlDatabase
    };
    res.render('urls_show', templateVars);
  }
});

// User can update the long URL to the urlDatabase -> maintains same short URL
app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id].url = req.body.newLongURL;
  urlDatabase[req.params.id].userID = req.session.user_id;
  res.redirect(301, '/urls/' + req.params.id);
});

// Login with proper credential
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!password) {
    res.send("password is required");
    return;
  }
  const user = findByEmail(email);
  if (!user) {
    res.send("Error: Account does not exist");
    return;
  }
  if (bcrypt.compareSync(password, user.password) && email === user.email) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {
    res.status(403).send('user not found');
  }
});

// New user can create new short URLs by entering long URL -> Redirect to short URL edit page
app.post("/urls", (req, res) => {
  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {};
  urlDatabase[newShortURL].url = newLongURL;
  urlDatabase[newShortURL].userID = req.session.user_id;
  res.redirect("/urls/" + newShortURL);
});

// New user created and added to the user database. Conditional on unique email.
app.post('/register', (req, res) => {
  let newUserID = generateRandomString();
  let newUserEmail = req.body.email;
  let newUserPassword = req.body.password;
  let hashedPassword = bcrypt.hashSync(newUserPassword, 12);
  if (newUserEmail === '' || newUserPassword === '') {
    res.status(400).send("enter email or password");

  } else if (newUserEmail === findByEmail(newUserEmail).email) {
    res.status(400).send("email already exists");

  } else {
    users[newUserID] = {};
    users[newUserID].id = newUserID;
    users[newUserID].email = newUserEmail;
    users[newUserID].password = hashedPassword;
    req.session.user_id = newUserID;
    res.redirect('/urls');
  }
});

// Redirect to corresponding long URL based on short URL in address bar
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

// Allows user to edit short URL parameters given they are URL owner
app.get('/urls/:id', (req, res) => {
  let url = req.params.id;
  if (!urlDatabase[url]) {
    res.status(400).send("This short URL does not exist!");
    return;
  }
  let templateVars =
  {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].url,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id),
    urlDatabase: urlDatabase
  };
  if (req.session.user_id) {
    res.render("urls_show", templateVars);
  } else {
    res.render('new_user', templateVars);
  }
});

// User taken to registration page if NOT a user -> Else redirected to homepage
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render("register");
  }
});

// Logout button -> Clears cookies from browser and takes back to homepage
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// APP LISTENING 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/test', (req, res) => {
  console.log(users);
  console.log(urlDatabase);
});