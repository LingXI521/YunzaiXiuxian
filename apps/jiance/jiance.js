import plugin from '../../../../lib/plugins/plugin.js'
import { __PATH } from "../Xiuxian/xiuxian.js"
import path from "path"
import fs from "fs"
import config from "../../model/Config.js"

export class jiance extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '检测',
            /** 功能描述 */
            dsc: '脚本',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#查询可疑名单$',
                    fnc: 'jiance_show'
                }
            ]
        });
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
        this.set = config.getdefSet('task', 'task')
        this.task = {
            cron: this.set.jiance_task,
            name: 'jiancetask',
            fnc: () => this.jiance()
        }
    }


async jiance() {
    let mingdang=await Read_mingdang();
    let mingdang_log=await Read_mingdang_log();
    var myDate = new Date();
    var year = myDate.getFullYear(); //获取完整的年份(4位,1970-????)
    var month = myDate.getMonth() + 1;  //获取当前月份(1-12)
    var day = myDate.getDate();  //获取当前日(1-31)
    var newDay = year + '-' + month + '-' + day;//获取完整年月日
    let qq="";
    qq+=newDay;
    qq+="\n";
    for (var i=0;i<mingdang.length;i++)
    {
        var time=0;
        for (var j=0;j<mingdang[i].time.length-2;j++)
        {
            if (Math.abs((mingdang[i].time[j+1]-mingdang[i].time[j])-(mingdang[i].time[j+2]-mingdang[i].time[j+1]))<500)
            {
                time++;
            }
        }
        if (time>3)
            {
                qq+=mingdang[i].qq+"x"+time+"\n";
            }
    }
    if (qq.length>0)
    {
        mingdang_log.push(qq);
        await Write_mingdang_log(mingdang_log);
    }
    else
    {
        qq+="无";
        mingdang_log.push(qq);
        await Write_mingdang_log(mingdang_log);
    }
    return;
}

async jiance_show(e) {
    if (!this.e.isMaster) {
        return;
    }
    let mingdang_log=await Read_mingdang_log();
    let qq="";
    for (var i=mingdang_log.length-1;i>mingdang_log.length-4;i--)
    {
        if (mingdang_log[i]!=undefined)
        {
            qq+=mingdang_log[i];
        }
    }
    if (qq.length>0)
    {
       e.reply(qq);
    }
    else
    {
        e.reply("空");
    }
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
export async function Write_mingdang_log(wupin) {
    let dir = path.join(__PATH.mingdang_log, `mingdang_log.json`);
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
export async function Read_mingdang_log() {
    let dir = path.join(`${__PATH.mingdang_log}/mingdang_log.json`);
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
export async function add_mingdang(usr_qq)
{
    let mingdang;
    try{
        mingdang= await Read_mingdang();
    }
    catch{
        //没有表要先建立一个！
        await Write_mingdang([]);
        mingdang=await Read_mingdang();
    }
    let i;
    for (i=0;i<mingdang.length;i++)
    {
        if (mingdang[i].qq==usr_qq)
        {
            break;
        }
    }
    if (i==mingdang.length)
    {
        let player={
            qq:usr_qq,
            time:[],
        }
        mingdang.push(player)
    }
    await Write_mingdang(mingdang);
    return;
}
export async function add_time(usr_qq)
{
    let mingdang=await Read_mingdang();
    let i;
    for (i=0;i<mingdang.length;i++)
    {
        if (mingdang[i].qq==usr_qq)
        {
            break;
        }
    }
    var nowtime= new Date().getTime();
    mingdang[i].time.push(nowtime);
    await Write_mingdang(mingdang);
    return;
}
