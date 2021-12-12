//https://www.mapcustomizer.com/

const fs = require('fs')

const citiesData = require('./cities.json')
const config = require('./config.json')

const Cities = require('./Cities.js')

const cities = new Cities(citiesData, config)

cities.startTimer()
const distances = cities.compileDistances()
let endTime = cities.endTimer()

fs.writeFile('outputs/distances.json', JSON.stringify(distances, null, 2), function (err) {
  if (err) throw err;
  console.log('Distance Data Was Saved Sucessfully!');
});

console.log(`Distance Data was Calculated in ${(endTime/1000).toFixed(1)} seconds`)

cities.startTimer()
const output = cities.findTriangles()
endTime = cities.endTimer()

console.log(`${output.length} City Combinations Found.`)

console.log(`File is ${(new TextEncoder().encode(JSON.stringify(output, null, 2)).length/1024/1024).toFixed(3)}MB`)

fs.writeFile('outputs/results.json', JSON.stringify(output, null, 2), function (err) {
  if (err) throw err;
  console.log('Triangles Data Was Saved Sucessfully!');
});

console.log(`Triangles Data was Calculated in ${(endTime/1000).toFixed(1)} seconds`)


