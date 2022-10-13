const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get("/", (req, res, next) => {
  //input validation
  const allowFilter = ["search", "type", "page", "limit"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    console.log(req.query);
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const filterKeys = Object.keys(filterQuery);
    console.log(filterKeys);
    filterKeys.forEach((key, i) => {
      if (!allowFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });
    //processing logic
    let offset = limit * (page - 1);

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    //Filter data by name Pokemon
    console.log(filterKeys);
    let result = [];
    if (filterKeys.length && filterKeys.includes("search")) {
      const filterSearch = filterQuery.search;
      result = result.length
        ? result.filter((pokemon) => pokemon.name.includes(filterSearch))
        : data.filter((pokemon) => pokemon.name.includes(filterSearch));

      //Filter data by type
    } else if (filterKeys.length && filterKeys.includes("type")) {
      let typeSearch = filterQuery.type;
      result = result.length
        ? result.filter((pokemon) => pokemon.types.includes(typeSearch))
        : data.filter((pokemon) => pokemon.types.includes(typeSearch));
    } else {
      result = data;
    }
    result = result.slice(offset, offset + limit);
    //send data
    res.status(200).send({ result });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    //input validation
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data, totalPokemons } = db;
    const { id } = req.params;
    const PokeId = Number(id);
    if (PokeId < 1 || PokeId > totalPokemons || !Number(id)) {
      const exception = new Error(`Pokemon ${PokeId} is not found`);
      exception.statusCode = 401;
      throw exception;
    }

    //put processing logic
    let index = data.findIndex((pokemon) => pokemon.id === PokeId);
    let previousIndex = index - 1;
    let nextIndex = index + 1;

    if (totalPokemons === PokeId) nextIndex = 0;
    if (PokeId === 1) previousIndex = totalPokemons - 1;

    result = {
      pokemon: data[index],
      previousPokemon: data[previousIndex],
      nextPokemon: data[nextIndex],
    };
    //put send response
    res.status(200).send({ result });
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  try {
    const pokemonTypes = [
      "bug",
      "dragon",
      "fairy",
      "fire",
      "ghost",
      "ground",
      "normal",
      "psychic",
      "steel",
      "dark",
      "electric",
      "fighting",
      "flyingText",
      "grass",
      "ice",
      "poison",
      "rock",
      "water",
    ];

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);

    //handle error
    const { data, totalPokemons } = db;
    let { name, id, url, types } = req.body;

    if (!name || !id || !types || !url) {
      const error = new Error(`Missing required data`);
      error.statusCode = 401;
      throw error;
    }

    if (types.length > 2) {
      const error = new Error(`Pokémon can only have one or two types`);
      error.statusCode = 401;
      throw error;
    }

    data.forEach((pokemon) => {
      if (pokemon.name === name || pokemon.id === id) {
        const error = new Error(`The Pokémon already exists`);
        error.statusCode = 401;
        throw error;
      }
    });
    // handle Pokemon's type is invalid
    const noMatchType = types.filter(
      (type) => !pokemonTypes.includes(type.toLowerCase())
    );

    if (noMatchType.length) {
      const exception = new Error(`Pokemon's type is invalid `);
      exception.statusCode = 401;
      throw exception;
    }

    //converted to lower case
    types = types.map((type) => type.toLowerCase());

    //processing
    id = Number(id);
    const newPokemon = { name, types, url, id };

    data.push(newPokemon);
    let totalPKM = data.length;
    db.totalPokemons = totalPKM;
    db.data = data;

    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    // send data
    res.status(200).send({ newPokemon });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", (req, res, next) => {
  //input validation
  try {
    const allowUpdate = ["name", "types", "description"];
    const { id } = req.params;
    const updates = req.body;
    const updateKeys = Object.keys(updates);
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }
    //processing logic

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    const targetIndex = data.findIndex((pokemon) => pokemon.id === Number(id));

    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    const updatePokemon = { ...db.data[targetIndex], ...updates };
    db.data[targetIndex] = updatePokemon;

    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);

    //sendata
    res.status(200).send({ updatePokemon });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", (req, res, next) => {
  //input validation
  try {
    const { id } = req.params;
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    const targetIndex = data.findIndex((pokemon) => pokemon.id === Number(id));
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    db.data = data.filter((pokemon) => pokemon.id !== Number(id));

    db = JSON.stringify(db);
    let totalPKM = data.length;
    db.totalPokemons = totalPKM;

    fs.writeFileSync("db.json", db);
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
