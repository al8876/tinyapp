const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

function generateRandomString() {
  var string = '';
  var possible = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
  for (var i = 0; i < 6; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  return string;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123456"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "abcdefg"
  },
  "test": {
    id: "test",
    email: "t@t.com",
    password: "test"
  }
}

// helpers

const findByEmail = (email) => {
  for (let key in users) {
    const user = users[key];
    if (user.email === email) {
      return user;
    }
  }
  return false;
};

// middleware

app.use(function(req, res, next) {
  res.locals.user = users[req.cookies.user_id] || false;
  next();
});

// routes

app.get("/urls/new", (req, res) => {
  res.render("urls_new")
});

app.get('/urls', (req, res) => {
  const user = users;
  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  console.log(req.cookies);
  res.render("urls_index", templateVars);
});

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render("registration");
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls')
});

app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL;
  console.log(req.body.newLongURL);
  res.redirect(301, '/urls/' + req.params.id)
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findByEmail(email);
  if (user) {
    res.cookie('user_id', user);
    res.redirect('/urls');
  } else {
    res.status(400).render('user not found');
  }
});

app.post("/urls", (req, res) => {
  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = newLongURL;

  let templateVars =
  {
    shortURL: newShortURL,
    longURL: newLongURL,
  };
  res.redirect("/urls/" + newShortURL)
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('urls')
});

app.post('/register', (req, res) => {
  let newUserID = generateRandomString();
  let newUserEmail = req.body.email;
  let newUserPassword = req.body.password;
  if (newUserEmail === '' || newUserPassword === '') {
    res.status(400).render('400');
  } else {
    users[newUserID] = {}
    users[newUserID].id = newUserID;  
    users[newUserID].email = newUserEmail;
    users[newUserID].password = newUserPassword;
    console.log(users);
    res.cookie('user_id', newUserID)
    res.redirect('/urls')
  }
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});


app.get('/urls/:id', (req, res) => {
  const user = users
  let templateVars =
  {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users,
  };
  console.log(templateVars);
  res.render('urls_show', templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});