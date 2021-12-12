const abbrv = require('./abbreviations.json')
module.exports = class {
  constructor(cities, config){
    this.cities = cities
    this.cl = cities.length
    if(!config.margin && !config.legs) throw new Error("Incomplete Config File")
    this.config = config
    this.a_max = config.legs.a + config.margin
    this.a_min = config.legs.a - config.margin
    this.b_max = config.legs.b + config.margin
    this.b_min = config.legs.b - config.margin
    this.c_max = config.legs.c + config.margin
    this.c_min = config.legs.c - config.margin
  }
  startTimer(){
    this.startTime = new Date().getTime()
  }
  endTimer(){
    return new Date().getTime() - this.startTime
  }
  compileDistances(){
    let iterated = new Set()
    let distances = new Set()
    for(let i = 0; i < this.cl; i++){
      for(let j = 0; j < this.cl; j++){
        if(i == j) continue
        const city1 = this.cities[i]
        const city2 = this.cities[j]
        const rank1 = city1.rank
        const rank2 = city2.rank
        iterated.add(rank2+"-"+rank1)
        const alreadyCalc = iterated.has(rank1+"-"+rank2)
        if(alreadyCalc){
          iterated.delete(rank2+"-"+rank1)
          continue
        }
        let distance = Math.floor(this.distCities(city1, city2))
        if(!this.withinMargin(distance)) {
          continue
        }
        let dist = { distance, cities: [rank1, rank2] }
        distances.add(dist)
        city1, city2, rank1, rank2, dist, distance = null
      }
    }
    this.distances = Array.from(distances)
    return this.distances
  }
  findTriangles(){
    const startTime = new Date().getTime()
    
    let a_v = []
    let b_v = []
    let c_v = []
    
    for(let i = 0; i < this.distances.length; i++){
      const dist = this.distances[i].distance
      if(dist < this.a_max && dist > this.a_min) a_v.push(this.distances[i])
      if(dist < this.b_max && dist > this.b_min) b_v.push(this.distances[i])
      if(dist < this.c_max && dist > this.c_min) c_v.push(this.distances[i])
    }
    
    let clean_output = []

    const cv = new Set()
    c_v.map(c => c.cities.join('-')).forEach(c => { cv.add(c) })
    
    for(let i = 0; i < a_v.length; i++){
      const a_c1 = a_v[i].cities[0]
      const a_c2 = a_v[i].cities[1]
      const t_b_v = b_v.filter(b => b.cities.includes(a_c1) || b.cities.includes(a_c2))
      for(let j = 0; j < t_b_v.length; j++){
        const b_c1 = t_b_v[j].cities[0]
        const b_c2 = t_b_v[j].cities[1]
        let c = null;
        if(b_c1 == a_c1){
          if(cv.has(`${a_c2}-${b_c2}`) || cv.has(`${b_c2}-${a_c2}`)) c = [a_c2, b_c2]
        } else if(b_c2 == a_c1){
          if(cv.has(`${a_c2}-${b_c1}`) || cv.has(`${b_c1}-${a_c2}`)) c = [a_c2, b_c1]
        } else if(b_c1 == a_c2){
          if(cv.has(`${a_c1}-${b_c2}`) || cv.has(`${b_c2}-${a_c1}`)) c = [a_c1, b_c2]
        } else {
          if(cv.has(`${a_c1}-${b_c1}`) || cv.has(`${b_c1}-${a_c1}`)) c = [a_c1, b_c1]
        }
        
        c = c ? { cities: c } : null

        if(c && !((a_v[i].cities == t_b_v[j].cities) || (a_v[i].cities == c.cities) || (c.cities == t_b_v[j].cities))){
          const tcs = new Set()
          tcs.add(a_v[i].cities[0]).add(a_v[i].cities[1])
          tcs.add(t_b_v[j].cities[0]).add(t_b_v[j].cities[1])
          tcs.add(c.cities[0]).add(c.cities[1])

          const tc = Array.from(tcs)
          for(let j = 0; j < tc.length; j++){
            tc[j] = this.cities.find(city => city.rank == tc[j])
          }

          let data = {}

          data.city_names = tc.map(t => `${t.city}, ${abbrv[t.state.toUpperCase()]}`).join(" | ")
          data.cords = tc.map(t => `${t.latitude.toFixed(3)},${t.longitude.toFixed(3)}`)

          c.distance = c_v.find(cc => cc.cities.includes(c.cities[1]) && cc.cities.includes(c.cities[0])).distance
          
          let legs = []
          const LEGS = [ a_v[i], t_b_v[j], c ]

          for(let l = 0; l < LEGS.length; l++){
            let side_letter = l == 0 ? "a" : l == 1 ? "b" : "c"
            let side = LEGS[l]
            legs[l] = {}
            let city1 = this.cities.find(city => city.rank == side.cities[0])
            let city2 = this.cities.find(city => city.rank == side.cities[1])
            legs[l].city1 = `${city1.city}, ${abbrv[city1.state.toUpperCase()]}`
            legs[l].city2 = `${city2.city}, ${abbrv[city2.state.toUpperCase()]}`
            legs[l].dist = side.distance
            legs[l].error = this.percentageOfError(Object.values(this.config.legs)[l], side.distance)
          }
          data.legs = legs
          data.perimeter = legs[0].dist + legs[1].dist + legs[2].dist
          data.area = this.heronsFormula(legs[0].dist, legs[1].dist, legs[2].dist)
          clean_output.push(data)
        }
      }
      if(i%5000==0) console.log(i, a_v.length, (new Date().getTime() - startTime)/1000 + 's')
    }
    return clean_output
  }
  percentageOfError(num, part){
    return Math.abs((100-(part/num)*100).toFixed(2)) + "%"
  }
  heronsFormula(a, b, c){
    const s = (a+b+c)/2
    const A = Math.sqrt(s*(s-a)*(s-b)*(s-c))
    return parseInt(A.toFixed(0))
  }
  withinMargin(dist){
    if(dist <= this.a_max && dist >= this.a_min) return true
    if(dist <= this.b_max && dist >= this.b_min) return true
    if(dist <= this.c_max && dist >= this.c_min) return true
    return false
  }
  distCities(city1, city2){
    return this.dist(city1.latitude, city1.longitude, city2.latitude, city2.longitude)
  }
  
  toRadians(deg){
    return (Math.PI / 180) * deg
  }
  
  findCityByName(name){
    return cities.find(city => city.city.toLowerCase().includes(name))
  }
  dist(lat1, long1, lat2, long2){
    const { acos, asin, sin, cos } = Math
    lat1 = this.toRadians(lat1)
    long1 = this.toRadians(long1)
    lat2 = this.toRadians(lat2)
    long2 = this.toRadians(long2)
  
    let dlong = long2 - long1;
    let dlat = lat2 - lat1;
  
    let a = Math.pow(Math.sin(dlat / 2), 2)
       + Math.cos(lat1) * Math.cos(lat2)
       * Math.pow(Math.sin(dlong / 2),2);
                 
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
    let r = 3956;
  
    return c * r;
  }
}