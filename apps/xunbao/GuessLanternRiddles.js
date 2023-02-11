import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import fs from "fs"
import { Read_player, existplayer, get_random_talent, getLastsign, Read_equipment, sleep, exist_najie_thing, Add_血气, getLastsign2 } from '../Xiuxian/xiuxian.js'
import { Write_equipment, Write_player, Write_najie } from '../Xiuxian/xiuxian.js'
import { shijianc, get_random_fromARR, isNotNull, ForwardMsg } from '../Xiuxian/xiuxian.js'
import { Add_灵石, Add_HP, Add_修为, Add_najie_thing, anti_cheating } from '../Xiuxian/xiuxian.js'
import { get_player_img, get_gongfa_img } from '../ShowImeg/showData.js'
import { segment } from "oicq"
import { __PATH } from "../Xiuxian/xiuxian.js"
import Show from '../../model/show.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';

/**
 * 全局
 */
let allaction = false;//全局状态判断
let WorldBOSSBattleCD = [];//CD
let WorldBOSSBattleLock = 0;//BOSS战斗锁，防止打架频率过高造成奖励多发
let WorldBOSSBattleUnLockTimer = 0;//防止战斗锁因意外锁死
/**
 * 新年系统
 */

export class GuessLanternRiddles extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'GuessLanternRiddles',
            /** 功能描述 */
            dsc: '猜灯谜模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#单抽(寻宝常驻|寻宝特殊up)$',
                    fnc: 'sk'
                },
                {
                    reg: '^#十连抽(寻宝常驻|寻宝特殊up)$',
                    fnc: 'skten'
                },
                {
                    reg: '^#自选存档皮肤.*$',
                    fnc: 'cundan_pifu'
                },
             
            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }
   
    
   
    //换肤
    async cundan_pifu(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        var didian = e.msg.replace('#自选存档皮肤', '');
        //命令判断
        let code = didian.split("\*");
        //数量判断
        didian = code[0];
        let type = code[1]
        let x = await exist_najie_thing(usr_qq, "虚无幻影", "道具")
        if (!x) {
            e.reply("你没有【虚无幻影】")
            return
        }
        if (!isNotNull(type)) {
            e.reply("未输入类型")
        }
        didian = didian.trim();
        let photo = 999;
        let File = fs.readdirSync(__PATH.player_pifu_path);
        File = File.filter(file => file.endsWith(".jpg"));
        let File_length1 = File.length;
        for (var k = 0; k < File_length1; k++) {
            if (didian == File[k].replace(".jpg", '')) {
                photo = didian;
                break;
            }

        }
        File = fs.readdirSync(__PATH.equipment_pifu_path);
        File = File.filter(file => file.endsWith(".jpg"));
        let File_length2 = File.length;
        for (var k = 0; k < File_length2; k++) {
            if (didian == File[k].replace(".jpg", '')) {
                photo = didian;
                break;
            }

        }
        if (photo == 999) {
            if (type == "练气") {
                e.reply("该图片id不存在,范围[0-" + (File_length1) + "]")
                return
            }
            if (type == "装备") {
                e.reply("该图片id不存在,范围[0-" + (File_length2) + "]")
                return
            }
            e.reply("你输入的类型不正确,例#自选存档皮肤2*练气(或装备)")
            return;
        }
        else {
            let kamian = ""
            if (type == "练气") {
                kamian = data.daoju_list.find(item => item.id == photo && item.type == "练气幻影卡面");
            }
            if (type == "装备") {
                kamian = data.daoju_list.find(item => item.id == photo && item.type == "装备幻影卡面");
            }
            let player = await Read_player(usr_qq)
            player.练气皮肤 = kamian.id
            await Write_player(usr_qq, player)
            await Add_najie_thing(usr_qq, kamian.name, "道具", 1)
            await Add_najie_thing(usr_qq, "虚无幻影", "道具", -1)
            e.reply("兑换" + kamian.name + "成功")
        }
        return;
    }
    async skten(e) {
        if (!e.isGroup) {
            return;
        }
        //固定写法
        let usr_qq = e.user_id;
        //判断是否为匿名创建存档
        if (usr_qq == 80000000) {
            return;
        }
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let thing = e.msg.replace("#", '');
        thing = thing.replace("十连抽", '');
        if (thing == "寻宝常驻") {
            let x = await exist_najie_thing(usr_qq, "泥土", "材料")
            if (!x) {
                e.reply("你没有【泥土】")
                return
            }
            if (x < 10) {
                e.reply("你没有足够的【泥土】")
                return
            }
            e.reply("十道金光从天而降")
            let msg = []
            let all = []
            await sleep(5000)
            for (var i = 0; 10 > i; i++) {
                let tianluoRandom = Math.floor(Math.random() * (data.changzhu.length));

                msg.push("一道金光掉落在地上，走近一看是【" + data.changzhu[tianluoRandom].name + "】")
                await Add_najie_thing(usr_qq, data.changzhu[tianluoRandom].name, data.changzhu[tianluoRandom].class, 1)
                all.push("【" + data.changzhu[tianluoRandom].name + "】")
            }
            await Add_najie_thing(usr_qq, "泥土", "材料", -10)
            await ForwardMsg(e, msg)
            e.reply("恭喜获得\n" + all)
        }
        if (thing == "寻宝特殊up") {
            let x = await exist_najie_thing(usr_qq, "树苗", "食材")
            if (!x) {
                e.reply("你没有【树苗】")
                return
            }
            if (x < 10) {
                e.reply("你没有足够的【树苗】")
                return
            }
            e.reply("十道金光从天而降")
            let msg = []
            let all = []
            await sleep(5000)
            for (var i = 0; 10 > i; i++) {
                let tianluoRandom = Math.floor(Math.random() * (data.xianding.length));

                msg.push("一道金光掉落在地上，走近一看是【" + data.xianding[tianluoRandom].name + "】")
                await Add_najie_thing(usr_qq, data.xianding[tianluoRandom].name, data.xianding[tianluoRandom].class, 1)
                all.push("【" + data.xianding[tianluoRandom].name + "】")
            }
            await Add_najie_thing(usr_qq, "树苗", "食材", -10)
            await ForwardMsg(e, msg)
            e.reply("恭喜获得\n" + all)
        }
    }

    async sk(e) {
        if (!e.isGroup) {
            return;
        }
        //固定写法
        let usr_qq = e.user_id;
        //判断是否为匿名创建存档
        if (usr_qq == 80000000) {
            return;
        }
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let thing = e.msg.replace("#", '');
        thing = thing.replace("单抽", '');
        if (thing == "寻宝常驻") {
           
            let x = await exist_najie_thing(usr_qq, "泥土", "材料")
            if (!x) {
                e.reply("你没有【泥土】")
                return
            }
            e.reply("一道金光从天而降")
            let tianluoRandom = Math.floor(Math.random() * (data.changzhu.length));
            await Add_najie_thing(usr_qq, data.changzhu[tianluoRandom].name, data.changzhu[tianluoRandom].class, 1)
            await Add_najie_thing(usr_qq, "泥土", "材料", -1)
            await sleep(5000)
            e.reply("一道金光掉落在地上，走近一看是【" + data.changzhu[tianluoRandom].name + "】")
        }
        if (thing == "寻宝特殊up") {
            
            let x = await exist_najie_thing(usr_qq, "树苗", "食材")
            if (!x) {
                e.reply("你没有【树苗】")
                return
            }
            e.reply("一道金光从天而降")
            let tianluoRandom = Math.floor(Math.random() * (data.xianding.length));
            await Add_najie_thing(usr_qq, data.xianding[tianluoRandom].name, data.xianding[tianluoRandom].class, 1)
            await Add_najie_thing(usr_qq, "树苗", "食材", -1)
            await sleep(5000)
            e.reply("一道金光掉落在地上，走近一看是【" + data.xianding[tianluoRandom].name + "】")
        }
    }
   



    

}
/**
 * 状态
 */
export async function Go(e) {
    let usr_qq = e.user_id;
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
        return;
    }
    //获取游戏状态
    let game_action = await redis.get("xiuxian:player:" + usr_qq + ":game_action");
    //防止继续其他娱乐行为
    if (game_action == 0) {
        e.reply("修仙：游戏进行中...");
        return;
    }
    //查询redis中的人物动作
    let action = await redis.get("xiuxian:player:" + usr_qq + ":action");
    action = JSON.parse(action);
    if (action != null) {
        //人物有动作查询动作结束时间
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
            e.reply("正在" + action.action + "中,剩余时间:" + m + "分" + s + "秒");
            return;
        }
    }
    allaction = true;
    return;
}