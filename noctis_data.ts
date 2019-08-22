import * as fs from "fs";
import { isObject, isString, isNumber } from "util";

export class Noctis {
  public guide_data = [];
  public stars = [];
  public planets = [];

  constructor() {
    this.readStarmap();
    this.readGuide();
  }

  readStarmap() {
    const buffer = fs.readFileSync("./data/starmap2.bin");

    var dataView = new DataView(buffer.buffer);
    var offset = 0;
    const readUInt8 = function() {
      const retval = buffer.readUInt8(offset);
      offset += 1;
      return retval;
    };
    const readInt32 = function() {
      const retval = buffer.readInt32LE(offset);
      offset += 4;
      return retval;
    };

    const numEntries = dataView.byteLength / 44;
    const stars = [];
    const planets = [];
    const scale = 0.0000001;

    for (var i = 0; i < numEntries; i++) {
      const star_x = readInt32();
      const star_y = readInt32();
      const star_z = readInt32();
      const index = readInt32();
      const unused = readInt32();
      const name = [
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8(),
        readUInt8()
      ]
        .map(x => String.fromCodePoint(x))
        .join("")
        .trim();
      const typestr = [readUInt8(), readUInt8(), readUInt8(), readUInt8()]
        .map(x => String.fromCodePoint(x))
        .join("");

      if (typestr[1] === "S") {
        stars.push({
          x: star_x,
          y: star_y,
          z: star_z,
          name: name,
          object_id: this.getIDForStarCoordinates(star_x, star_y, star_z),
          type: typestr.substr(2)
        });
      } else if (typestr[1] === "P") {
        planets.push({
          x: star_x,
          y: star_y,
          z: star_z,
          name: name,
          index: typestr.substr(2),
          _index: index
        });
      }
    }
    this.stars = stars;
    this.planets = planets;
  }

  readGuide() {
    const buffer_guide = fs.readFileSync("./data/GUIDE.BIN");
    let offset = 4;
    const getUInt8 = function() {
      const retval = buffer_guide.readUInt8(offset);
      offset += 1;
      return retval;
    };
    const getDoubleLE = function() {
      const retval = buffer_guide.readDoubleLE(offset);
      offset += 8;
      return retval;
    };
    var datas = [];
    while (offset < buffer_guide.byteLength) {
      try {
        var objid = getDoubleLE();
        var text = "";
        for (var j = 0; j < 76; j++) {
          text = text + String.fromCharCode(getUInt8());
        }
      } catch (e) {
        console.error(e);
      }
      var newdata = {
        object_id: objid,
        text: text
      };
      datas.push(newdata);
    }
    this.guide_data = datas;
  }

  getIDForStarCoordinates = (x, y, z) => {
    return (x / 100000) * (y / 100000) * (z / 100000);
  };

  getStarByName = starname => {
    const starname_lower = starname.toLowerCase();
    return this.stars.find(star => {
      return star.name.toLowerCase() == starname_lower;
    });
  };

  getPlanetByName = planetname => {
    const planetname_lower = planetname.toLowerCase();
    return this.planets.find(planet => {
      return planet.name.toLowerCase() == planetname_lower;
    });
  };

  getIDForStar = starname_or_object => {
    let star = starname_or_object;
    if (isString(starname_or_object)) {
      star = this.getStarByName(starname_or_object);
    }
    if (isObject(star)) {
      return this.getIDForStarCoordinates(star.x, star.y, star.z);
    }
  };

  getStarByID = starid => {
    if (!isNumber(starid)) {
      starid = this.getIDForStar(starid);
    }
    return this.stars.find(function(entry) {
      const diff = entry.object_id - starid;
      return diff > -0.00001 && diff < 0.00001;
    });
  };

  private getGuideEntriesById = id => {
    return this.guide_data.filter(function(entry) {
      const diff = entry.object_id - id;
      return diff > -0.00001 && diff < 0.00001;
    });
  };

  getGuideEntriesForStar = starid => {
    if (!isNumber(starid)) {
      starid = this.getIDForStar(starid);
    }
    return this.getGuideEntriesById(starid);
  };

  getGuideEntriesForPlanetByName = (planetName: string) => {
    const planet = this.getPlanetByName(planetName);
    if (planet) {
      const starid = this.getIDForStarCoordinates(planet.x, planet.y, planet.z);
      const planetid = planet._index + starid;
      return this.getGuideEntriesById(planetid);
    }
  };
}
