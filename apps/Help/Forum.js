//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import fs, {write} from "fs"
import path from "path"
import {Add_najie_thing, Add_灵石, Read_najie, __PATH, foundthing, Locked_najie_thing} from "../Xiuxian/xiuxian.js"
import {existplayer, Read_player, isNotNull, exist_najie_thing} from "../Xiuxian/xiuxian.js"
import Show from "../../model/show.js"
import puppeteer from "../../../../lib/puppeteer/puppeteer.js"
/**
 * 冒险家协会byDD斩首(3196383818)
 */
/**
 * 全局变量
 */
let allaction = false;//全局状态判断
export async function SerchZT(e) {
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
    //let player = await Read_player(usr_qq);
    //if (player.当前血量 < 200) {
    //    e.reply("你都伤成这样了,就不要出去浪了");
    //    return;
    //}
    allaction = true;
    return;
}

async function Pu(e, x) {
    let usr_qq = e.user_id;
    let title0 = x;
    title0 = Number(title0);
    let F;
    try {
        F = await Read_Forum();
    } catch {
        await Write_Forum([]);
        F = await Read_Forum();
    }
    let thingless = F[title0];
    if (!isNotNull(thingless)) {
        e.reply("冒险家协会暂时没有关于他的委托")
        return
    }
    if (thingless.usr == usr_qq) {
        e.reply("凯瑟琳:？")
        return
    }
    //要查看冷却
    let nowtime = new Date().getTime();
    let end_time = thingless.end_time;
    let time = (end_time - nowtime) / 60000;
    time = Math.ceil(time);
    if (time <= 0) {
        let najieNumber = await exist_najie_thing(usr_qq, thingless.thing.name, thingless.thing.class)
        if (najieNumber == false) {
            najieNumber = 0
        }
        let thing_pinji = thingless.pinji
        let thing_name = thingless.thing.name
        //判断戒指中的数量
        if (thingless.thing.class == "装备") {
            let pinji = ['劣', '普', '优', '精', '极', '绝', '顶']
            let najie = await Read_najie(usr_qq)
            let thing_pinji_number2 = findIndex(pinji, thing_pinji)
            let thing_quantity2 = najie.装备.find(item => item.name == thing_name && item.pinji == thing_pinji_number2)
            if (!isNotNull(thing_quantity2)) {
                e.reply("您没有足够的,合格的[" + thing_name + "]交付委托")
                return
            } else {
                thing_quantity2 = thing_quantity2.数量
            }
            if (najieNumber < thingless.thingNumber) {//不够
                e.reply(`你目前只有[${thing_name}【${pinji[najie.装备.find(item => item.name == thing_name && item.pinji == thing_pinji_number2).pinji]}】]*${thing_quantity2}`);
                return;
            }
        } else {
            if (najieNumber < thingless.thingNumber) {//不够
                e.reply(`你目前只有[${thing_name}]*${najieNumber}`);
                return;
            }
        }
        if (await Locked_najie_thing(usr_qq, thing_name, thingless.thing.class) == 1) {
            //锁定
            e.reply(`你的纳戒中的${thingless.thing.class}[${thing_name}]是锁定的`);
            return;
        }
        let n = Number(thingless.thingNumber)
        let pinji = ['劣', '普', '优', '精', '极', '绝', '顶']
        if (thingless.thing.class == "装备") {
            let thing_pinji_number2 = findIndex(pinji, thing_pinji)
            await Add_najie_thing(usr_qq, thingless.thing.name, thingless.thing.class, -n, thing_pinji_number2)
            await Add_najie_thing(thingless.usr, thingless.thing.name, thingless.thing.class, n, thing_pinji_number2)
        } else {
            await Add_najie_thing(usr_qq, thingless.thing.name, thingless.thing.class, -n)
            await Add_najie_thing(thingless.usr, thingless.thing.name, thingless.thing.class, n)
        }
        await Add_灵石(usr_qq, thingless.thingJIAGE)
        F.splice(title0, 1);//删除
        await Write_Forum(F)
        await genxinliebiao(F)
        e.reply("成功接受委托,获得灵石" + thingless.thingJIAGE)
        return;
    } else {
        e.reply("物品冷却中...");
    }
}

export class Forum extends plugin {
    constructor() {
        super({
            name: 'Forum',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#冒险家协会$',
                    fnc: 'Searchforum'
                },
                {
                    reg: '^#发布委托[\u4e00-\u9fa5]*\\*[1-9]\d*\\*[1-9]\d*(\\*[\u4e00-\u9fa5])?',
                    fnc: 'Pushforum'
                },
                {
                    reg: '^#接受委托[1-9]\d*$',
                    fnc: 'Put'
                },
                {
                    reg: '^#取消委托[1-9]\d*$',
                    fnc: 'off'
                }
            ]
        })
    }

    async off(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        if (usr_qq == 80000000) {
            return;
        }
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        // e.reply("功能修复中")
        // return
        let title0 = e.msg.replace("#", '');
        title0 = title0.replace("取消委托", '');
        title0 = Number(title0);
        title0 = Math.trunc(title0);
        let F;
        try {
            F = await Read_Forum();
        } catch {
            await Write_Forum([]);
            F = await Read_Forum();
        }
        if (title0 > F.length || title0 <= 0) {
            e.reply("不要试图卡bug");
            return;
        }
        if (F[title0 - 1].usr != usr_qq) {
            e.reply("凯瑟琳:这好像不是你的委托。");
            return;
        }
        let player=await Read_player(usr_qq)
        let guihuan = 0;
        let jiage;
        //找到并删掉
        if (F[title0 - 1].usr == usr_qq) {
            //要查看冷却
            let nowtime = new Date().getTime();
            let end_time = F[title0 - 1].end_time;
            let time = (end_time - nowtime) / 60000;
            time = Math.ceil(time);
            if (time <= 0) {
                const thingless = F[title0 - 1];
                jiage = Number(thingless.thingJIAGE*0.8);
                guihuan += jiage;
                await Add_灵石(usr_qq, jiage);
                F.splice(title0 - 1, 1);//删除
                await Write_Forum(F);
            } else {
                e.reply("物品冷却中。。。");
                return;
            }
        }
        await genxinliebiao(F)
         e.reply("成功取消该委托，已归还委托金" + guihuan+"收取委托管理费用"+guihuan*0.1)
    }

    async Put(e) {
        //选购需要常用判断
        //固定写法
        let usr_qq = e.user_id;
        if (!e.isGroup) {
            return;
        }
        if (usr_qq == 80000000) {
            return;
        }
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //全局状态判断
        await SerchZT(e);
        if (allaction) {
        } else {
            return;
        }
        allaction = false;
        //防并发cd
        var time0 = 1;//分钟cd
        let player=await Read_player(usr_qq)
        //获取当前时间
        let now_time = new Date().getTime();
        let ForumCD = await redis.get("xiuxian:player:" + usr_qq + ":ForumCD");
        ForumCD = parseInt(ForumCD);
        let transferTimeout = parseInt(60000 * time0)
        if (now_time < ForumCD + transferTimeout) {
            let ForumCDm = Math.trunc((ForumCD + transferTimeout - now_time) / 60 / 1000);
            let ForumCDs = Math.trunc(((ForumCD + transferTimeout - now_time) % 60000) / 1000);
            e.reply(`每${transferTimeout / 1000 / 60}分钟操作一次，` + `CD: ${ForumCDm}分${ForumCDs}秒`);
            //存在CD。直接返回
            return;
        }
        //记录本次执行时间
        await redis.set("xiuxian:player:" + usr_qq + ":ForumCD", now_time);
        let now_level_id;
        if (!isNotNull(player.level_id)) {
            e.reply("请先#同步信息");
            return;
        }
        let Forum;
        try {
            Forum = await Read_Forum();
        } catch {
            //没有表要先建立一个！
            await Write_Forum([]);
            Forum = await Read_Forum();
        }
        let t = e.msg.replace("#接受委托", "");
        //let thingqq = t[0];
        let x = parseInt(t) - 1;
        if (x >= Forum.length) {
            return;
        }
        await Pu(e, x);
    }

    async Searchforum(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let Forum;
        try {
            Forum = await Read_Forum();
        } catch {
            await Write_Forum([]);
            Forum = await Read_Forum();
        }
        let nowtime = new Date().getTime();
        let searchforumData_data = {
            Forum,
            nowtime
        }
        const data1 = await new Show(e).get_searchforumData(searchforumData_data);
        let img = await puppeteer.screenshot("searchforum", {
            ...data1,
        });
        e.reply(img);

        return;
    }

    async Pushforum(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        if (usr_qq == 80000000) {
            return;
        }
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let Forum;
        try {
            Forum = await Read_Forum();
        } catch {
            await Write_Forum([]);
            Forum = await Read_Forum();
        }
        let player=await Read_player(usr_qq)
        //标题
        let title0 = e.msg.replace("#", '');
        title0 = title0.replace("发布委托", '');
        //内容
        let code = title0.split("\*");
        console.log(code)
        let thing_name = code[0];//东西
        let thing_amount = code[1];//数量
        let thing_value = code[2];//价格
        let thing_pinji = code[3]//品级
        if (thing_name.length == 0) {
            e.reply("未填写需求");
            return;
        } 
        if (
            thing_amount < 1 ||
            thing_amount == null ||
            thing_amount == undefined ||
            thing_amount == NaN
        ) {
            e.reply("凯瑟琳:故意找茬是吧")
            return;
        }
        if (thing_value < 1) {
            e.reply("凯瑟琳:故意找茬是吧")
            return
        }
        if (!isNaN(parseFloat(thing_value)) && isFinite(thing_value)) {
        } else {
            return;
        }
        if (!isNaN(parseFloat(thing_amount)) && isFinite(thing_amount)) {
        } else {
            return;
        }
        thing_amount = Math.ceil(thing_amount);
        thing_value =  Math.ceil(thing_value);

        console.log(player.灵石)
        if (thing_value > player.灵石 || player.灵石 < 0) {
            e.reply("很明显您身上的灵石不足以支付委托金呢")
            return
        }
        if (thing_amount < 1 || thing_amount == null || thing_amount == undefined || thing_amount == NaN) {
            thing_amount = 1;
        }
        if (thing_value <= 0) {
            return;
        }
        if (!isNaN(parseFloat(thing_value)) && isFinite(thing_value)) {
        } else {
            return;
        }
        if (!isNaN(parseFloat(thing_amount)) && isFinite(thing_amount)) {
        } else {
            return;
        }
        //判断列表中是否存在，不存在不能卖,并定位是什么物品
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`这方世界没有这样的东西:${thing_name}`);
            return;
        }
        if (thing_exist.id >= 400991 && thing_exist.id <= 400999) {
            e.reply(`轮回功法${thing_name}禁止出售。`)
            return;
        }
        if (thing_exist.class == "装备") {
            if (!isNotNull(thing_pinji)) {
                e.reply("未输入品级")
                return
            }
            let pinji = ['劣', '普', '优', '精', '极', '绝', '顶']
            let pinji_yes = true
            for (var i = 0; i < pinji.length; i++) {
                if (pinji[i] == thing_pinji) {
                    pinji_yes = false
                    break
                }
            }
            if (pinji_yes) {
                e.reply("未输入正确品级")
                return
            }
        }
        // 价格阈值设定
        if (thing_value <= thing_exist.出售价 * 0.8 * thing_amount && thing_exist.出售价 != 1) {
            e.reply('价格过低');
            return;
        }
        if (thing_value >= thing_exist.出售价 * 3 * thing_amount && thing_exist.出售价 != 1) {
            e.reply('价格过高');
            return;
        }
        if (thing_exist.出售价 == 1 && thing_value > 5000000 * thing_amount) {
            e.reply('价格过高');
            return;
        }
        await Add_灵石(usr_qq, -thing_value)
        //随机编号
        let Mathrandom = Math.random();
        Mathrandom = usr_qq + Mathrandom
        Mathrandom = Mathrandom * 100000
        Mathrandom = Math.trunc(Mathrandom);
        //时间
        var myDate = new Date();
        var year = myDate.getFullYear(); //获取完整的年份(4位,1970-????)
        var month = myDate.getMonth() + 1;  //获取当前月份(1-12)
        var day = myDate.getDate();  //获取当前日(1-31)
        var newDay = year + '-' + month + '-' + day;//获取完整年月日
        let now_time = new Date().getTime();
        let time = 10;//分钟
        if (thing_exist.class == "装备") {
            var wupin = {
                "title": thing_name,//发布名
                "qq": usr_qq,//发布名
                "time": newDay,//发布时间
                "number": Mathrandom,//编号
                "thing": thing_exist,
                "thingNumber": thing_amount,
                "thingJIAGE": thing_value,
                "usr": e.user_id,
                "weizhi": Forum.length,
                "pinji": thing_pinji,
                "now_time": now_time,
                "end_time": now_time + 60000 * time
            };
        } else {
            var wupin = {
                "title": thing_name,//发布名
                "qq": usr_qq,//发布名
                "time": newDay,//发布时间
                "number": Mathrandom,//编号
                "thing": thing_exist,
                "thingNumber": thing_amount,
                "thingJIAGE": thing_value,
                "usr": e.user_id,
                "weizhi": Forum.length,
                "now_time": now_time,
                "end_time": now_time + 60000 * time
            };
        }
        Forum.push(wupin);
        await Write_Forum(Forum);
        e.reply("发布成功！花费" + thing_value + "灵石");
        return;
    }
}

//写入
export async function Write_Forum(wupin) {
    let dir = path.join(__PATH.Forum, `Forum.json`);
    let new_ARR = JSON.stringify(wupin, "", "\t");
    fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
        console.log('写入成功', err)
    })
    return;
}

//更新下标
export async function genxinliebiao(Forum) {
    for (var i = 0; Forum.length > i; i++) {
        if (Forum[i].weizhi == 0) {
        } else {
            Forum[i].weizhi -= 1
        }
        await Write_Forum(Forum)
    }
    return;
}

//读取
export async function Read_Forum() {
    let dir = path.join(`${__PATH.Forum}/Forum.json`);
    let Forum = fs.readFileSync(dir, 'utf8', (err, data) => {
        if (err) {
            console.log(err)
            return "error";
        }
        return data;
    })
    Forum = JSON.parse(Forum);
    return Forum;
}

function findIndex(list, item) {
    for (let i in list) {
        if (list[i] == item) {
            return i;
        }
    }
    // 没有找到元素返回-1
    return -1;
}

export async function Pushforum_ASS(e) {
    if (!e.isMaster) {
        return;
    }
    e.reply("冒险家协会开始同步");
    let Forum;
    try {
        Forum = await Read_Forum();
    } catch {
        await Write_Forum([]);
        Forum = await Read_Forum();
    }
    let now_time = new Date().getTime();
    let time = 30;//分钟
    for (var i = 0; i < Forum.length; i++) {
        if (!isNotNull(Forum[i].now_time)) {
            Forum[i].now_time = now_time;
        }
        if (!isNotNull(Forum[i].end_time)) {
            Forum[i].end_time = now_time + 60000 * time;
        }
    }
    await Write_Forum(Forum);
    e.reply("冒险家协会同步结束");
    return;
}