import * as fs from "fs";
const config = JSON.parse(fs.readFileSync("./config.json").toString());
import { Client, Events, EmbedBuilder, GatewayIntentBits, SlashCommandBuilder, REST, Routes, Collection } from "discord.js";
import { Noctis } from "./noctis_data";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const Universe = new Noctis();
const rest = new REST().setToken(config.token);

const makeEmbed = (title: string, data: string) => {
  return new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle(title)
    .setAuthor({ name: "GOESDNET", url: "https://github.com/jorisvddonk/goesdnet", iconURL: "http://mooses.nl/nice/misc/noctisiv_logo.png" })
    .setThumbnail("http://mooses.nl/nice/misc/noctisiv_logo.png")
    .addFields([{ name: 'data', value: data, inline: true }]);
};

const lookupCommand = {
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Look up coordinates of star/planet')
    .addStringOption(option =>
      option.setName('name')
        .setRequired(true)
        .setDescription('The name to look up in the Starmap')),
  async execute(interaction) {
    const tgt = interaction.options.getString('name');

    const star = Universe.getStarByName(tgt);
    const planet = Universe.getPlanetByName(tgt);

    if (star !== undefined) {
      const embed = makeEmbed(
        `Star S${star.type} ${star.name} found at`,
        `x: ${star.x}\ny: ${star.y}\nz: ${star.z}`
      );
      const guideEntries = Universe.getGuideEntriesForStar(tgt);
      embed.setFooter({ text: `${guideEntries.length} guide entries available` });
      await interaction.reply({ embeds: [embed] });
    } else if (planet !== undefined) {
      const starid = Universe.getIDForStarCoordinates(
        planet.x,
        planet.y,
        planet.z
      );
      const parentstar = Universe.getStarByID(starid);
      const embed = makeEmbed(
        `Planet P${planet.index} ${planet.name} ${parentstar !== undefined
          ? "found orbiting " + parentstar.name
          : "orbiting around unknown star"
        } at`,
        `x: ${planet.x}\ny: ${planet.y}\nz: ${planet.z}`
      );
      const guideEntries = Universe.getGuideEntriesForPlanetByName(planet.name);
      embed.setFooter({ text: `${guideEntries.length} guide entries available` });
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply("No object found!");
    }
  },
};

const guideCommand = {
  data: new SlashCommandBuilder()
    .setName('guide')
    .setDescription('Look up text in the Guide')
    .addStringOption(option =>
      option.setName('object_name')
        .setRequired(true)
        .setDescription('The name to look up in the Guide'))
    .addNumberOption(option =>
      option.setName('start_offset')
        .setRequired(false)
        .setDescription('The offset of the first entry to show')),
  async execute(interaction) {
    const tgt = interaction.options.getString('object_name');
    const offset = interaction.options.getNumber('start_offset');


    let guideEntries = Universe.getGuideEntriesForStar(
      Universe.getIDForStar(tgt)
    );
    if (guideEntries.length === 0) {
      guideEntries = Universe.getGuideEntriesForPlanetByName(tgt);
    }

    let entriesText = "No entries found in GUIDE";
    let entriesFooter = null;
    if (guideEntries.length > 0) {
      const offsetMax = offset + 10;
      const displayGuideEntries = guideEntries.filter((x, index) => {
        return index >= offset && index < offsetMax;
      });
      entriesText = displayGuideEntries.map(x => `> ${x.text}`).join("\n");
      const remainingEntries = guideEntries.length - offsetMax;
      if (remainingEntries > 0) {
        entriesFooter = `${remainingEntries} more entries available. /guide ${tgt.toUpperCase()} ${offsetMax}`;
      } else {
        entriesFooter = "No more entries remaining";
      }
    }
    if (entriesText.length > 0) {
      const embed = makeEmbed(
        `Guide entries for ${tgt.toUpperCase()}`,
        entriesText
      );
      if (entriesFooter) {
        embed.setFooter({ text: entriesFooter });
      }
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply(`No entries available for ${tgt.toUpperCase()}`);
    }
  }
};

const commands = new Collection();
commands.set(lookupCommand.data.name, lookupCommand);
commands.set(guideCommand.data.name, guideCommand);
(client as any).commands = commands;

(async () => {
  try {
    let commands = [lookupCommand.data.toJSON(), guideCommand.data.toJSON()];
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(
      (Routes as any).applicationCommands(config.clientId),
      { body: commands },
    );
    console.log(data);
  } catch (error) {
    console.error(error);
  }
})();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.login(config.token);
