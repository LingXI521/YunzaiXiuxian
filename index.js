import fs from "node:fs";
import Config from "./model/Config.js";//引入获取配置的js
import chalk from 'chalk'
//定义一个版本信息的常量,获取默认文件配置文件信息
const versionData = Config.getdefSet("version", "version");
//打印启动日志
logger.info(`__________________________`);
logger.info(chalk.yellow(`修仙模拟器${versionData[0].version}「${versionData[0].name}」初始化`));
logger.info(`体验群一：372093406`);
logger.info(`体验群二：642919478`);
logger.info(`原开发1：水脚脚`);
logger.info(`原开发2：咸咸咸鱼鱼`);
logger.info(`原开发3：零零零零`);
logger.info(`开发1：DD斩首`);
logger.info(`开发2：零`);
logger.info(`开发3：RetuEase`);
logger.info(`开发4：香菜`);
logger.info(`策划1：再氪两单嘛`);
logger.info(`源码提供：墨宇,啵唧,xh`);
logger.info(`__________________________`);
/**
 * 遍历获取
 */
let sum = [""];
let filepath = "./plugins/xiuxian-emulator-plugin/apps"

function readdirectory(dir) {
    let files = fs.readdirSync(dir);
    files.forEach(async item => {
        let filepath1 = dir + '/' + item
        let stat = fs.statSync(filepath1)
        if (stat.isFile()) {
        } else {
            let file = filepath1.replace(filepath, "");
            sum.push(file);
        }
    })
}

readdirectory(filepath);
/**
 * import
 */
let apps = {};
var bian = "";
//循环写入
for (var i = 0; i < sum.length; i++) {
    bian = sum[i];
    var files = fs
        .readdirSync("./plugins/xiuxian-emulator-plugin/apps" + bian)
        .filter((file) => file.endsWith(".js"));
    for (let file of files) {
        let name = file.replace(".js", "");
        apps[name] = (await import('./apps' + bian + '/' + file))[name];
    }
}
//导出
export {apps};
