const Discord = require('discord.js')
const client = new Discord.Client() 
const db = require("quick.db")
const canvacord = require("canvacord")
const { MessageAttachment } = require("discord.js")
const { MessageEmbed } = require("discord.js")
const config = require('./config.json')
client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds. | Made by lebyy`);
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});
client.on("message", message =>{
if (!message.guild || message.author.bot) return;
xp(message)
})
function xp(message) {
	client.cooldown = new Discord.Collection();
    if (!client.cooldown.has(`${message.author.id}`) || !(Date.now() - client.cooldown.get(`${message.author.id}`) > client.config.cooldown)) {
        let xp = db.add(`xp_${message.guild.id}_${message.author.id}`, 1);
        let level = Math.floor(0.3 * Math.sqrt(xp));
        let lvl = db.get(`level_${message.guild.id}_${message.author.id}`) || db.set(`level_${message.guild.id}_${message.author.id}`,1);;
        if (level > lvl) {
            let newLevel = db.set(`level_${message.guild.id}_${message.author.id}`,level);
            message.channel.send(`:tada: ${message.author.toString()}, You just advanced to level ${newLevel}!`).then(message => {
    message.delete({ timeout: 4000 })
  })
  .catch(console.error);
        }
        client.cooldown.set(`${message.author.id}`, Date.now());
    }
}

client.on("message", async message => {
  if(message.author.bot) return;
  
  if(!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
   
  if(command === "rank") {
  let user =
    message.mentions.users.first() ||
    client.users.cache.get(args[0]) ||
   // match(args.join(" ").toLowerCase(), message.guild) ||
    message.author;

  let level = db.get(`level_${message.guild.id}_${user.id}`) || 0;
  level = level.toString();
  let exp = db.get(`xp_${message.guild.id}_${user.id}`) || 0;
  let neededXP = Math.floor(Math.pow(level / 0.1, 2));

  let data = db.all().filter(i => i.ID.startsWith(`xp_${message.guild.id}`)).sort((a, b) => b.data - a.data);
 let rank = data.map(m => m.ID).indexOf(`xp_${message.guild.id}_${user.id}`) + 1
 rank = rank.toString();
  let img = await canvacord.rank({
    username: user.username,
    discrim: user.discriminator,
    currentXP: exp.toString(),
    neededXP: neededXP.toString(),
    status: user.presence.status,
    rank,
    level,
    avatarURL: user.displayAvatarURL({ format: "png" })
  //  background: "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?ixlib=rb-1.2.1&w=1000&q=80"
  });
  return message.channel.send(new MessageAttachment(img, "rank.png"));
}

 if(command === "leaderboard") {
    let data = db.all().filter(i => i.ID.startsWith(`xp_${message.guild.id}`)).sort((a, b) => b.data - a.data);
    if (data.length < 1) return message.channel.send("No leaderboard");
    let myrank = data.map(m => m.ID).indexOf(`xp_${message.guild.id}_${message.author.id}`) + 1 || "N/A";
    data.length = 20;
    let lb = [];
    for (let i in data)  {
        let id = data[i].ID.split("_")[2];
        let user = await client.users.cache.get(id);
        user = user ? user.tag : "Unknown User#0000";
        let rank = data.indexOf(data[i]) + 1;
        let level = db.get(`level_${message.guild.id}_${id}`);
        let xp = data[i].data;
        let xpreq = Math.floor(Math.pow(level / 0.1, 2));
        lb.push({
            user: { id, tag: user },
            rank,
            level,
            xp,
            xpreq
        });
    };

    const embed = new MessageEmbed()
    .setTitle("Leaderboard")
    .setColor("RANDOM")
    lb.forEach(d => {
        embed.addField(`${d.rank}. ${d.user.tag}`, `**Level** - ${d.level}\n**XP** - ${d.xp} / ${d.xpreq}`);
    });
    embed.setFooter(`Your Position: ${myrank}`);
    return message.channel.send(embed);
 }
})
client.login("TOKEN");
