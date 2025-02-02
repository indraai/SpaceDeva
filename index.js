// Copyright (c)2022 Quinn Michaels
// The Space Deva
const Deva = require('@indra.ai/deva');
const fs = require('fs');
const path = require('path');
const needle = require('needle');

const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  describe: package.description,
  version: package.version,
  dir: __dirname,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  author: package.author,
  license: package.license,
  copyright: package.copyright,
};
const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const SPACE = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    process(input) {return input.trim()}
  },
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
      this.context('file');
      let spacePath;
      const {params} = opts.meta;
      const thing = params[0];
      const space = params[1];
      const ident = opts.text.split(':');
      const section = ident[1] ? ident[1].toUpperCase() : 'MAIN';
      return new Promise((resolve, reject) => {
      switch (thing) {
        case 'docs':
          spacePath = `${space}/${thing}/${ident[0]}.feecting`;
          break;
        default:
          const route = ident[0].split('/');
          const doc = route[1];
          let room = route[0];
          room = room.length == 1 ? `000${room}` : room;
          room = room.length == 2 ? `00${room}` : room;
          room = room.length == 3 ? `0${room}` : room;
          const dir1 = room.substr(0, room.length - 3) + 'xxx';
          const dir2 = room.substr(0, room.length - 2) + 'xx';
          spacePath = `${space}/${thing}/${dir1}/${dir2}/${room}/${doc}.feecting`;
          break;
        }
        if (this.vars.path) {
          try {
            const spaceFile = this.fs.readFileSync(path.join(this.vars.path, spacePath));
            const text = spaceFile.toString('utf8').split(`::BEGIN:${section}`)[1].split(`::END:${section}`)[0];
            return resolve(text);
          } catch (e) {
            return reject(e);
          }
        }
        else {
          needle('get', `${this.vars.url}/${spacePath}`).then(result => {
            const text = result.body.toString('utf8').split(`::BEGIN:${section}`)[1].split(`::END:${section}`)[0];
            return resolve(text)
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
      this.context('view');
      return new Promise((resolve, reject) => {
        this.func.getSpaceFile(data.q).then(spaceFile => {
          return this.question(`#feecting parse:${data.q.meta.params[0]}:${data.q.meta.params[1]} ${spaceFile}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          })
        }).catch(reject);
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
    method: maps
    params: packet
    describe: Call a world file from the space server.
    ***************/
    maps(packet) {
      this.context('maps');
      return this.func.maps(packet);
    },

    /**************
    method: place
    params: packet
    describe: Call a world file from the space server.
    ***************/
    world(packet) {
      this.context('world');
      return this.func.view(packet);
    },

    /**************
    method: object
    params: packet
    describe: Call an objext file from the space server
    ***************/
    object(packet) {
      this.context('object');
      return this.func.view(packet);
    },

    /**************
    method: agent
    params: packet
    describe: Call an Agent file from the space server
    ***************/
    agent(packet) {
      this.context('agent');
      return this.func.view(packet);
    },

    /**************
    method: docs
    params: packet
    describe: Call an Docs file from the space server
    ***************/
    docs(packet) {
      this.context('docs');
      return this.func.view(packet);
    },
  },
  onDone(config) {
    const services = this.services();
    this.vars.url = services.global.urls.space;
    this.vars.path = services.global.paths.space || false;
    return Promise.resolve(config);
  }
});
module.exports = SPACE
