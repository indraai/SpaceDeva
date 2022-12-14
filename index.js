// Copyright (c)2022 Quinn Michaels
// The Space Deva

const fs = require('fs');
const path = require('path');

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Deva = require('@indra.ai/deva');
const SPACE = new Deva({
  agent: {
    uid: agent.uid,
    key: agent.key,
    name: agent.name,
    describe: agent.describe,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }
  },
  vars,
  listeners: {},
  modules: {},
  deva: {},
  func: {
    /**************
    func: getSpaceFile
    params: opts - optsion object
    describe: The getSpaceFile function will take a string and then pull the corresponding
    space file from the designated location set in the data.config file.
    ***************/
    getSpaceFile(opts) {
      let spaceFile, spacePath, dir1, dir2
      const thing = opts.meta.params[0];
      const space = opts.meta.params[1];
      const ident = opts.text.split('/');
      let room = ident[0];
      const sec = ident[1] ? ident[1].split(':') : [];

      room = room.length == 1 ? `000${room}` : room;
      room = room.length == 2 ? `00${room}` : room;
      room = room.length == 3 ? `0${room}` : room;

      const doc = sec[0] ? sec[0].toLowerCase() : 'main';
      const section = sec[1] ? sec[1].toUpperCase() : 'MAIN';

      return new Promise((resolve, reject) => {

      switch (thing) {
        case 'help':
          spacePath = path.join(__dirname, 'data', space, thing, `${data.text}.feecting`);
          return resolve(fs.readFileSync(spacePath, 'utf8'));
        default:
          dir1 = room.substr(0, room.length - 3) + 'xxx';
          dir2 = room.substr(0, room.length - 2) + 'xx';
          spacePath = `${this.client.services.space}/${space}/${thing}/${dir1}/${dir2}/${room}/${doc}.feecting`;

          this.question(`#web get ${spacePath}`).then(result => {
            const text = result.a.text.toString('utf8').split(`::BEGIN:${section}`)[1].split(`::END:${section}`)[0];

            resolve({
              text: text,
              html: text,
              data: {spacePath},
            })
          }).catch(reject)
        }
      });
    },

    /**************
    func: view
    params: data
    describe: The view function will pass in a data object that will then call the
    getSpaceFile function to pull the profper space file then pass it off to
    feecting for parsing before return.
    ***************/
    view(data) {
      return new Promise((resolve, reject) => {
        this.func.getSpaceFile(data.q).then(spaceFile => {
          return this.question(`#feecting parse:${data.q.meta.params[0]}:${data.q.meta.params[1]} ${spaceFile.text}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          })
        });
      });
    },

    /**************
    func: maps
    params: packet
    describe: return a map for your needs.
    ***************/
    maps(packet) {
      const {params} = packet.q.meta;
      const map = `img:${params[1]}/map/${packet.q.text}`;

      return new Promise((resolve, reject) => {
        this.question(`#feecting parse ${map}`).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        });
      });
    },
  },
  methods: {
    /**************
    method: hash
    params: packet
    describe: The hash method exposes the hash function which calls the core
    hash features to become available to the space Deva.
    ***************/
    hash(packet) {
      return this.hash(packet);
    },

    /**************
    method: maps
    params: packet
    describe: Call a world file from the space server.
    ***************/
    maps(packet) {
      return this.func.maps(packet);
    },

    /**************
    method: world
    params: packet
    describe: Call a world file from the space server.
    ***************/
    world(packet) {
      return this.func.view(packet);
    },

    /**************
    method: object
    params: packet
    describe: Call an objext file from the space server
    ***************/
    object(packet) {
      return this.func.view(packet);
    },

    /**************
    method: agent
    params: packet
    describe: Call an Agent file from the space server
    ***************/
    agent(packet) {
      return this.func.view(packet);
    },

    /**************
    method: uid
    params: packet
    describe: Return a system uid to the space Deva.
    ***************/
    uid(packet) {
      return Promise.resolve(this.uid());
    },

    /**************
    method: status
    params: packet
    describe: Return the current status of the space Deva.
    ***************/
    status(packet) {
      return this.status();
    },

    /**************
    method: help
    params: packet
    describe: Read the help files for the space Deva method.
    ***************/
    help(packet) {
      return new Promise((resolve, reject) => {
        this.lib.help(packet.q.text, __dirname).then(help => {
          return this.question(`#feecting parse ${help}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        }).catch(reject);
      });
    },
  },
});
module.exports = SPACE
