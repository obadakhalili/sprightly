"use strict";

const { join } = require('path');
const { promises: fs } = require('fs');

class Sprightly {
  async parse(file) {
    file = file.split('\n');
    this.fileContent = file; // register the current file content. Used in specifiying errors location
    for (let i = 0; i < file.length; i++) {
      this.level = i; // register the current level in file. Used in specifiying errors location
      for (let match = file[i].match(this.regexp), result; match;) {
        if (match[0][0] === '<') {
          this.directory = `${match[1].trim()}.${this.options.settings['view engine']}`; // register the current file. Used in specifiying errors location
          result = await this.read(join(this.options.settings.views, this.directory));
        } else {
          result = this.options[match[2].trim()];
        }
        file[i] = file[i].replace(match[0], result ? result : '');
        match = file[i].match(this.regexp);
      }
    }
    return file.join('');
  }
  async read(path) {
    const file = (await fs.readFile(path)).toString();
    return await this.parse(file);
  }
};
Sprightly.prototype.regexp = /<<(.*?)>>|\{\{(.*?)\}\}/; // to match Sprightly syntax

const sprightly = new Sprightly();

module.exports = async (path, options, callback) => {
  try {
    sprightly.options = options;
    callback(undefined, await sprightly.read(path));
  } catch (e) {
    const message = `Cannot find file or directory "${sprightly.directory}" inside the views directory
        ${sprightly.level - 1 >= 0 ? `${String(sprightly.level).padStart(4, '0')}| ${sprightly.fileContent[sprightly.level - 1]}` : ''}
    >>  ${String(sprightly.level + 1).padStart(4, '0')}| ${sprightly.fileContent[sprightly.level]}
        ${sprightly.level + 1 < sprightly.fileContent.length ? `${String(sprightly.level + 2).padStart(4, '0')}| ${sprightly.fileContent[sprightly.level + 1]}` : ''}`;
    callback(message);
  }
};