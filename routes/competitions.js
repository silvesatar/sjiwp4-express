const express = require("express");
const router = express.Router();
const { authRequired, adminRequired } = require("../services/auth.js");
const Joi = require("joi");
const { db } = require("../services/db.js");

// GET /competitions
router.get("/", authRequired, function (req, res, next) {
    const stmt = db.prepare(`
        SELECT c.id, c.name, c.description, u.name AS author, c.apply_till
        FROM competitions c, users u
        WHERE c.author_id = u.id
        ORDER BY c.apply_till
    `);

    const result = stmt.all();

    res.render("competitions/index", { result: { items: result } });
});

// SCHEMA id
const schema_id = Joi.object({
    id: Joi.number().integer().positive().required()
});

// GET /competitions/delete/:id
router.get("/delete/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("DELETE FROM competitions WHERE id = ?;");
    const deleteResult = stmt.run(req.params.id);

    if (!deleteResult.changes || deleteResult.changes !== 1) {
        throw new Error("Operacija nije uspjela");
    }

    res.redirect("/competitions");
});

// GET /competitions/edit/:id
router.get("/edit/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("SELECT * FROM competitions WHERE id = ?;");
    const selectResult = stmt.get(req.params.id);

    if (!selectResult) {
        throw new Error("Neispravan poziv");
    }

    res.render("competitions/form", { result: { display_form: true, edit: selectResult } });
});

// SCHEMA edit
const schema_edit = Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required()
});

// POST /competitions/edit
router.post("/edit", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_edit.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("UPDATE competitions SET name = ?, description = ?, apply_till = ? WHERE id = ?;");
    const updateResult = stmt.run(req.body.name, req.body.description, req.body.apply_till, req.body.id);

    if (updateResult.changes && updateResult.changes === 1) {
        res.redirect("/competitions");
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});

// GET /competitions/add
router.get("/add", adminRequired, function (req, res, next) {
    res.render("competitions/form", { result: { display_form: true } });
});

// SCHEMA add
const schema_add = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required()
});

// POST /competitions/add
router.post("/add", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_add.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("INSERT INTO competitions (name, description, author_id, apply_till) VALUES (?, ?, ?, ?);");
    const insertResult = stmt.run(req.body.name, req.body.description, req.user.sub, req.body.apply_till);

    if (insertResult.changes && insertResult.changes === 1) {
        res.render("competitions/form", { result: { success: true } });
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});

// GET /competitions/login/:id
router.get("/apply/:id", function (req, res, next) {

    //validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Došlo je do greške!");
    }

    // PROVJERA JE LI KORISNIK VEĆ PRIJAVLJEN

    const checkStmt1 = db.prepare("SELECT count(*) FROM apply_comp WHERE id_user = ? AND id_competition = ?;");
    const checkResult1 = checkStmt1.get(req.user.sub, req.params.id);

    console.log(checkResult1);

    if (checkResult1["count(*)"] <= 0) {

        // UPISIVANJE U BAZU

        const stmt = db.prepare("INSERT INTO apply_comp (id_user, id_competition, score, date) VALUES (?, ?, 0, ?);");
        const updateResult = stmt.run(req.user.sub, req.params.id, new Date().toISOString());

        if (updateResult.changes && updateResult.changes === 1) {
            res.render("competitions/apply");
        } else {
            res.render("competitions/form", { result: { database_error: true } });
        }
    }
    else {
        restart.redner("competitions/form", { result: { database_error: true } })
    }
});

// GET /competitions/apply/:id

/*router.get("/apply/:id", adminRequired, function (req, res, next) {
    res.render("competitions/apply");
});*/

/* router.get("/applied", adminRequired, function (req, res, next) {
    res.render("competitions/form", { result: { display_form: true } });
}); */


// 2. ZADATAK

//GET /competitions/input_score/:id

router.get("/input_score/:id", adminRequired, function (req, res, next){

    const stmt = db.prepare(`SELECT c.name AS NazivNatjecanja., u.name AS Natjecatelj, a.id AS login_id, a.id_user, a.score
    FROM competitions c, users u, apply_comp a
    WHERE a.id_user = u.id AND a.id_competition = c.id NAD a.id_competition = ?;`
    );

    const result = stmt.all(req.params.id);

    res.render("competitions/input_score", { result: { items:result }});
});

// SCHEMA score
const schema_score = Joi.object({
    id: Joi.number().integer().positive().required(),
    score: Joi.number().min(1).max(1000).required()
})

//POST /competitions/change_score/
router.post("/change_score", authRequired, function (req, res, next){
    const result = schema_score.validate(req.body);
    if(result.error) {
        throw new Error("Neispravan poziv");
        return;
    }
    const stmt = db.prepare("UPDATE apply_comp SET score = ? WHERE id = ?");
    const updateResult = stmt.run(req.body.score, req.body.id);

    if (updateResult.changes && updateResult.changes === 1)
    {
        res.render("competitions/from", {result: { score_success: true } });
    }
    else{
        res.render("competitions/form", { result: { database_error: true}});
    }
});

//GET /competitions/applied/:id
router.get("/applied/:id", function (req, res, next) {

    const stmt = db.prepare(`SELECT u.name AS natjecatelj, a.score, a.id_user
    FROM competitions c, users u, apply_comp a
    WHERE a.id_user = u.id AND a.id_competition = c.id AND a.id_competition = ?
    ORDER BY a.score DESC;
    `);

    const result = stmt.all(req.params.id);

    console.log(result);

    const stmt1 = db.prepare("SELECT name AS natjecanje, apply_till AS datum FROM competitions WHERE id = ?");

    const data = stmt1.all(req.params.id);

    console.log(data);

    res.render("competitions/applied", { result: { items: result, data }, data: { items: data } });
});

module.exports = router;