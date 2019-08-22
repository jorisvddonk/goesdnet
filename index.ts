import * as fs from "fs";
const config = JSON.parse(fs.readFileSync("./config.json").toString());
import * as Discord from "discord.js";
import { Noctis } from "./noctis_data";

const client = new Discord.Client();
const Universe = new Noctis();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
  if (msg.content.indexOf("!starcoords ") === 0) {
    const tgt = msg.content.replace("!starcoords ", "");
    const star = Universe.getStarByName(tgt);
    if (star !== undefined) {
      const exampleEmbed = new Discord.RichEmbed()
        .setColor("#0099ff")
        .setAuthor(
          "GOESDNET",
          undefined,
          "https://github.com/jorisvddonk/goesdnet"
        )
        .setThumbnail("http://mooses.nl/nice/misc/noctisiv_logo.png")
        .addField(
          `Star S${star.type} ${star.name} found at:`,
          `> x: ${star.x}\n> y: ${star.y}\n> z: ${star.z}`
        );
      msg.channel.send(exampleEmbed);
    } else {
      msg.channel.send("Star not found!");
    }
  }
});

client.login(config.token);
