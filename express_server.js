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

// Data objects

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
}

// test console logs

app.get('/test', (req, res) => {
console.log(users);
console.log(urlDatabase);
});

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

const findUserByID = (user_id) => {
  for (let key in users) {
    const user = users[key];
    if (user.id === user_id) {
      return user.id;
    }
  }
  return false;
};

const findUserEmailByID = (user_id) => {
  for (let key in users) {
    const user = users[key];
    if (user.id === user_id) {
      return user.email;
    }
  }
  return false;
};

function generateRandomString() {
  var string = '';
  var possible = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
  for (var i = 0; i < 6; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  return string;
}

// routes

app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
})

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id)
  }
  if (req.session.user_id) { 
    res.render("urls_new", templateVars)
  } else {
    res.render("new_user")
  }
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id)
  }; 
  res.render("urls_index", templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id)
  };
  res.render('login', templateVars)
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls')
});

app.get('/urls/:id/delete', (req, res) => {
  let user = req.session.user_id;
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userID === user) { 
    delete urlDatabase[req.params.id];
    res.redirect('/urls')
  } else {
    let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].url,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id),
    urlDatabase: urlDatabase
    }
    res.render('urls_show',templateVars)
  }
});

app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id].url = req.body.newLongURL;
  urlDatabase[req.params.id].userID = req.session.user_id;
  res.redirect(301, '/urls/' + req.params.id)
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!password) {
    res.send("password is required")
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

app.post("/urls", (req, res) => {
  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {}
  urlDatabase[newShortURL].url = newLongURL;
  urlDatabase[newShortURL].userID = req.session.user_id;
  let templateVars =
  {
    shortURL: newShortURL,
    longURL: newLongURL,
    user: findUserByID(req.session.user_id),
    userEmail: findUserEmailByID(req.session.user_id)
  };
  res.redirect("/urls/" + newShortURL);
});

app.post('/register', (req, res) => {
  let newUserID = generateRandomString();
  let newUserEmail = req.body.email;
  let newUserPassword = req.body.password;
  let hashedPassword = bcrypt.hashSync(newUserPassword, 12);
  if (newUserEmail === '' || newUserPassword === '') {
    res.status(400).send("enter email or password");

  } else if (newUserEmail === findByEmail(newUserEmail).email) {
    res.status(400).send("email already exists")

  } else {
    users[newUserID] = {}
    users[newUserID].id = newUserID;  
    users[newUserID].email = newUserEmail;
    users[newUserID].password = hashedPassword;
    req.session.user_id = newUserID;
    res.redirect('/urls')
  }
})


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url
  res.redirect(longURL);
});

app.get('/urls/:id', (req, res) => {
  let url = req.params.id;
  if (!urlDatabase[url]) {
    res.status(400).send("This short URL does not exist!")
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
    res.render("urls_show", templateVars)
  } else {
    res.render('new_user',templateVars)
  }
});

app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');  
  } else {
    res.render("register");
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});