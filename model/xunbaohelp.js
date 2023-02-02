import base from './base.js';
import xiuxianCfg from './Config.js';

export default class Help1 extends base {
  constructor(e) {
    super(e);
    this.model = 'xunbaohelp';
  }

  static async xunbaohelp(e) {
    let html = new Help1(e);
    return await html.xunbaohelp();
  }

  async xunbaohelp() {
    let helpData = xiuxianCfg.getdefSet('help', 'xunbaohelp');
    let versionData = xiuxianCfg.getdefSet('version', 'version');
    const version =
      (versionData && versionData.length && versionData[0].version) || '1.0.4';
    const version_name =
      (versionData && versionData.length && versionData[0].name) || '1.0.4';
    return {
      ...this.screenData,
      saveId: 'help',
      version: version,
      version_name: version_name,
      helpData,
    };
  }
}
