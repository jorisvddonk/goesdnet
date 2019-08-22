import * as fs from "fs";

export class Noctis {
  private guide_data = [];
  private stars = [];

  constructor() {
    const buffer = fs.readFileSync("./data/starmap2.bin");

    var dataView = new DataView(buffer.buffer);
    var offset = 0;
    var readUInt8 = function() {
      var retval = dataView.getUint8(offset);
      offset += 1;
      return retval;
    };
    var readInt32 = function() {
      var retval = dataView.getInt32(offset);
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
          y: -star_y,
          z: star_z,
          name: star_name,
          type: star_typestr.substr(2)
        });
      }
    }
    this.stars = stars;

    const buffer_guide = fs.readFileSync("./data/GUIDE.bin");
    var dataView = new DataView(buffer_guide.buffer);
    var offset = 4;
    var getUInt8 = function() {
      var retval = dataView.getUint8(offset);
      offset += 1;
      return retval;
    };
    var datas = [];
    while (offset < dataView.byteLength) {
      try {
        var sub = new DataView(
          new Uint8Array([
            getUInt8(),
            getUInt8(),
            getUInt8(),
            getUInt8(),
            getUInt8(),
            getUInt8(),
            getUInt8(),
            getUInt8()
          ]).buffer
        );
        var objid = sub.getFloat64(0, true);
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
    var starname_lower = starname.toLowerCase();
    return this.stars.find(star => {
      return star.name.toLowerCase() == starname_lower;
    });
  };

  getIDForStar = starname_or_object => {
    var star = starname_or_object;
    if (typeof starname_or_object === "string") {
      star = this.getStarByName(starname_or_object);
    }
    return this.getIDForStarCoordinates(star.x, star.y, star.z);
  };

  getGuideEntriesForStar = starid => {
    if (typeof starid !== "number") {
      starid = this.getIDForStar(starid);
    }
    return this.guide_data.filter(function(entry) {
      var diff = entry.object_id - starid;
      return diff > -0.00001 && diff < 0.00001;
    });
  };
}
