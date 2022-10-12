const fs = require("fs");
const csv = require("csvtojson");
const { faker } = require("@faker-js/faker");

const createPokemonData = async () => {
  //csv to json
  let newData = await csv().fromFile("pokemon.csv");
  // json to object JS
  let data = JSON.parse(fs.readFileSync("db.json"));
  newData = newData.slice(0, 721);
  //transform data
  newData = newData.map((pokemon, i) => {
    let type1 = pokemon.Type1.toLowerCase();
    let type2 = pokemon.Type2?.toLowerCase();
    let description = faker.lorem.sentence();
    let height = `${faker.datatype.number({ max: 50, precision: 0.1 })}'`;
    let weight = `${faker.datatype.number({ max: 40, precision: 0.1 })}. lbs`;
    let category = faker.word.adjective();
    let abilities = faker.hacker.verb();

    return {
      id: ++i,
      name: pokemon.Name,
      types: type2 ? [type1, type2] : [type1],
      url: `http://localhost:8000/images/${i}.png`,
      description,
      height,
      weight,
      category,
      abilities,
    };
  });

  // add newData vào data trc khi save
  data.data = newData;
  data.totalPokemons = newData.length;

  fs.writeFileSync("db.json", JSON.stringify(data));
};

createPokemonData();
