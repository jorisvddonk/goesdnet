import * as fs from "fs";
import { isObject, isString, isNumber } from "util";

export class Noctis {
  public guide_data = [];
  public stars = [];

  constructor() {
    this.readStarmap();
    this.readGuide();
  }

  readStarmap() {
    const buffer = fs.readFileSync("./data/starmap2.bin");

    var dataView = new DataView(buffer.buffer);
    var offset = 0;
    var readUInt8 = function() {
      const retval = buffer.readUInt8(offset);
      offset += 1;
      return retval;
    };
    var readInt32 = function() {
      const retval = buffer.readInt32LE(offset);
      offset += 4;
      return retval;
    };

    var numEntries = dataView.byteLength / 44;
    var stars = [];
    var scale = 0.0000001;

    for (var i = 0; i < numEntries; i++) {
      var star_x = readInt32();
      var star_y = readInt32();
      var star_z = readInt32();
      var star_index = readInt32();
      var star_unused = readInt32();
      var star_name = [
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
      var star_typestr = [readUInt8(), readUInt8(), readUInt8(), readUInt8()]
        .map(x => String.fromCodePoint(x))
        .join("");

      if (star_typestr[1] === "S") {
        stars.push({
          x: star_x,
          y: star_y,
          z: star_z,
          name: star_name,
          type: star_typestr.substr(2)
        });
      }
    }
    this.stars = stars;
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

  getIDForStar = starname_or_object => {
    let star = starname_or_object;
    if (isString(starname_or_object)) {
      star = this.getStarByName(starname_or_object);
    }
    if (isObject(star)) {
      return this.getIDForStarCoordinates(star.x, star.y, star.z);
    }
  };

  getGuideEntriesForStar = starid => {
    if (!isNumber(starid)) {
      starid = this.getIDForStar(starid);
    }
    return this.guide_data.filter(function(entry) {
      const diff = entry.object_id - starid;
      return diff > -0.00001 && diff < 0.00001;
    });
  };
}
