const express = require("express");
const router = express.Router();
const { authRequired, adminRequired } = require("../services/auth.js");

// GET /competitions
router.get("/", authRequired, function (req, res, next) {
    res.render("competitions/index");
});

// GET /competiotions/add
router.get("/add", adminRequired, function (req, res, next) {
    res.render("competitions/add", { result: { display_form: true}});
});

// SCHEMA add
const schema_signin = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Kpom.date().iso().required()
  });

  // POST /competitions/add
router.post("/signin", function (req, res, next) {
    // do validation
    const result = schema_signin.validate(req.body);
    if (result.error) {
      res.render("users/signin", { result: { validation_error: true, display_form: true } });
      return;
    }
  
    const stmt = db.prepare("INSERT INTO competitions (name, descrtiption, author_id, apply_till) VALUES (?, ?, ?, ?)")
    const inesrtResult = stmt.run(req.body.name, req.body.description, req.user.uid, req.body.apply_till);
    if (inesrtResult.changes && inesrtResult.changes === 1){
        res.render("competitions/add", {result: { succes: true}})
    } else {
        res.render("competitions/add", {result: { database:error}})
    }

      res.render("users/signin", { result: { invalid_credentials: true } });
  });

// POST /competiotions/add
router.post("/add", adminRequired, function (req, res, next) {
    res.render("competitions/add", { result: { display_form: true}});
});

module.exports = router;
