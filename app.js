const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isLoggedin, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  //   console.log(user);
  res.render("profile", { user });
});

app.get("/like/:id", isLoggedin, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  //   console.log(user);
  if (post.likes.indexOf(req.user.userid) === -1)
    post.likes.push(req.user.userid);
  else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }

  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id", isLoggedin, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  //   console.log(user);
  res.render("edit", { post });
});

app.post("/update/:id", isLoggedin, async (req, res) => {
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, {content: req.body.content});
    //   console.log(user);
    res.redirect("/profile");
  });

app.post("/register", async (req, res) => {
  let { username, name, age, email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already exists");
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        age,
        email,
        password: hash,
      });

      let token = jwt.sign(
        { email: user.email, userid: user._id },
        "secretkey"
      );
      res.cookie("token", token);
      res.send("User registered successfully");
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.send("Something went wrong");
  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign(
        { email: user.email, userid: user._id },
        "secretkey"
      );
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/login");
  });
});

function isLoggedin(req, res, next) {
  let token = req.cookies.token;
  if (!token) {
    res.send("You need to login first");
  } else {
    let data = jwt.verify(token, "secretkey");
    // console.log(data);
    req.user = data;
    next();
  }
}

app.post("/posts", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });

  let { content } = req.body;
  let post = await postModel.create({
    user: user._id,
    content,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
