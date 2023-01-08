import plugin from '../../../../lib/plugins/plugin.js'
import { __PATH } from "../Xiuxian/xiuxian.js"
import path from "path"
import fs from "fs"
import config from "../../model/Config.js"

export class qingkong extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '检测',
            /** 功能描述 */
            dsc: '脚本',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: []
        });
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
        this.set = config.getdefSet('task', 'task')
        this.task = {
            cron: this.set.qingkong_task,
            name: 'qingkongtask',
            fnc: () => this.jiance()
        }
    }


async jiance() {
    let mingdang=await Read_mingdang();
    mingdang=[];
    await Write_mingdang(mingdang);
    return;
}


}
export async function Write_mingdang(wupin) {
    let dir = path.join(__PATH.mingdang, `mingdang.json`);
    let new_ARR = JSON.stringify(wupin, "", "\t");
    fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
        console.log('写入成功', err)
    })
    return;
}
export async function Read_mingdang() {
    let dir = path.join(`${__PATH.mingdang}/mingdang.json`);
    let mingdang = fs.readFileSync(dir, 'utf8', (err, data) => {
        if (err) {
            console.log(err)
            return "error";
        }
        return data;
    })
    //将字符串数据转变成数组格式
    mingdang = JSON.parse(mingdang);
    return mingdang;
}
