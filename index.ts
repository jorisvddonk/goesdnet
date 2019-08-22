import * as fs from "fs";
const config = JSON.parse(fs.readFileSync("./config.json").toString());
import * as Discord from "discord.js";
import { Noctis } from "./noctis_data";

const client = new Discord.Client();
const Universe = new Noctis();

const makeEmbed = (title: string, data: string) => {
  return new Discord.RichEmbed()
    .setColor("#0099ff")
    .setAuthor("GOESDNET", undefined, "https://github.com/jorisvddonk/goesdnet")
    .setThumbnail("http://mooses.nl/nice/misc/noctisiv_logo.png")
    .addField(title, data);
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
  if (msg.content.indexOf("!lookup ") === 0) {
    const tgt = msg.content.replace("!lookup ", "");
    const star = Universe.getStarByName(tgt);
    const planet = Universe.getPlanetByName(tgt);

    if (star !== undefined) {
      const embed = makeEmbed(
        `Star S${star.type} ${star.name} found at:`,
        `> x: ${star.x}\n> y: ${star.y}\n> z: ${star.z}`
      );
      const guideEntries = Universe.getGuideEntriesForStar(tgt);
      embed.setFooter(`${guideEntries.length} guide entries available`);
      msg.channel.send(embed);
    } else if (planet !== undefined) {
      const starid = Universe.getIDForStarCoordinates(
        planet.x,
        planet.y,
        planet.z
      );
      const parentstar = Universe.getStarByID(starid);
      const embed = makeEmbed(
        `Planet P${planet.index} ${planet.name} ${
          parentstar !== undefined
            ? "found orbiting " + parentstar.name
            : "orbiting around unknown star"
        } at:`,
        `> x: ${planet.x}\n> y: ${planet.y}\n> z: ${planet.z}`
      );
      // TODO: show number of guide entries for planets.
      msg.channel.send(embed);
    } else {
      msg.channel.send("No object found!");
    }
  }
});

client.login(config.token);
console.log(Universe.getIDForStar("BALASTRACKONASTREYA"));
