//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import fs from "fs"
import { segment } from "oicq"
import {
    Read_player,
    existplayer,
    exist_najie_thing,
    instead_equipment,
    player_efficiency,
    Read_najie,
    get_random_talent,
    Write_player,
    sleep,
    ForwardMsg,
    Reduse_player_学习功法, Locked_najie_thing
} from '../Xiuxian/xiuxian.js'
import {
    Add_灵石,
    Add_najie_thing,
    Add_HP,
    Add_修为,
    Add_魔道值,
    change_神之心,
    Add_player_学习功法,
    Add_najie_灵石,
    isNotNull,
    Add_血气,
    Read_equipment,
    Write_equipment,
    foundthing
} from '../Xiuxian/xiuxian.js'
import { __PATH } from "../Xiuxian/xiuxian.js"
import { Add_仙宠 } from "../Pokemon/Pokemon.js"
import { get_equipment_img } from '../ShowImeg/showData.js'

/**
 * 全局变量
 */
let allaction = false;//全局状态判断
/**
 * 货币与物品操作模块
 */
export class UserHome extends plugin {
    constructor() {
        super({
            name: 'UserHome',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [{
                reg: '^#(存|取)灵石(.*)$',
                fnc: 'Take_lingshi'
            }, {
                reg: '^#(装备|消耗|服用|学习|打开|解除封印|寻宝)((.*)|(.*)*(.*))$',
                fnc: 'Player_use'
            }, {
                reg: '^#购买((.*)|(.*)*(.*))$',
                fnc: 'Buy_comodities'
            }, {
                reg: '^#出售.*(\\*[\u4e00-\u9fa5])?\\*[1-9]\d*',
                fnc: 'Sell_comodities'
            }, {
                reg: '^#哪里有(.*)$',
                fnc: 'find_thing'
            }, {
                reg: '^#召唤天理$',
                fnc: 'heavenly'
            }, {
                reg: '^#精炼.*$',
                fnc: 'refining'
            }, {
                reg: '^#检查存档.*$',
                fnc: 'check_player'
            }, {
                reg: '^#抽(天地卡池|灵界卡池|凡界卡池)$',
                fnc: 'sk'
            }, {
                reg: '^#十连抽(天地卡池|灵界卡池|凡界卡池)$',
                fnc: 'skten'
            }, {
                reg: '^#供奉奇怪的石头$',
                fnc: 'Add_lhd'
            },
            {
                reg: '^#活动兑换.*$',
                fnc: 'huodong'
            }]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }
    async huodong(e) {
        if (!e.isGroup) {
            return;
        }
        //固定写法
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        var name = e.msg.replace("#活动兑换", '');
        name = name.trim();
        let i;//获取对应npc列表的位置
        for (i = 0; i < data.duihuan.length; i++) {
            if (data.duihuan[i].name == name) {
                break;
            }
        }
        if (i == data.duihuan.length) {
            e.reply("兑换码不存在!");
            return;
        }
        let action = await redis.get("xiuxian:player:" + usr_qq + ":duihuan");//兑换码
        action = await JSON.parse(action);
        if (action == null) {
            action = [];
        }
        for (var k = 0; k < action.length; k++) {
            if (action[k] == name) {
                e.reply("你已经兑换过该兑换码了");
                return;
            }
        }
        action.push(name);
        await redis.set("xiuxian:player:" + usr_qq + ":duihuan", JSON.stringify(action));
        let msg = [];
        for (var k = 0; k < data.duihuan[i].thing.length; k++) {
            await Add_najie_thing(usr_qq, data.duihuan[i].thing[k].name, data.duihuan[i].thing[k].class, data.duihuan[i].thing[k].数量);
            msg.push("\n" + data.duihuan[i].thing[k].name + "x" + data.duihuan[i].thing[k].数量);
        }
        e.reply("恭喜获得:" + msg);
        return;
    }
    async check_player(e) {
        if (!e.isMaster) {
            e.reply("只有主人可以执行操作");
            return;
        }
        let File = fs.readdirSync(__PATH.player_path);
        File = File.filter(file => file.endsWith(".json"));
        let File_length = File.length;
        let cundang = ["存档"];
        let najie = ["纳戒"];
        let equipment = ["装备"];
        for (var k = 0; k < File_length; k++) {
            let usr_qq = File[k].replace(".json", '');
            try {
                await Read_player(usr_qq);
            } catch {
                cundang.push("\n");
                cundang.push(usr_qq);
            }
            try {
                await Read_najie(usr_qq);
            } catch {
                najie.push("\n");
                najie.push(usr_qq);
            }
            try {
                await Read_equipment(usr_qq);
            } catch {
                equipment.push("\n");
                equipment.push(usr_qq);
            }
        }
        if (cundang.length > 1) {
            await e.reply(cundang);
        } else {
            cundang.push("正常");
            await e.reply(cundang);
        }
        if (najie.length > 1) {
            await e.reply(najie);
        } else {
            najie.push("正常");
            await e.reply(najie);
        }
        if (equipment.length > 1) {
            await e.reply(equipment);
        } else {
            equipment.push("正常");
            await e.reply(equipment);
        }
        return;
    }

    async Add_lhd(e) {
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
        let x = await exist_najie_thing(usr_qq, "长相奇怪的小石头", "道具")
        if (!x) {
            e.reply("你翻遍了家里的院子，也没有找到什么看起来奇怪的石头\n于是坐下来冷静思考了一下。\n等等，是不是该去一趟精神病院？\n自己为什么突然会有供奉石头的怪念头？");
            return;
        }
        let player = await data.getData("player", usr_qq);
        if (player.轮回点 >= 10 && player.lunhui == 0) {
            e.reply("你梳洗完毕，将小石头摆在案上,点上香烛，拜上三拜！")
            await sleep(3000);
            player.当前血量 = 1;
            player.血气 -= 500000;
            e.reply(`奇怪的小石头灵光一闪，你感受到胸口一阵刺痛，喷出一口鲜血：\n` + `“不好，这玩意一定是个邪物！不能放在身上！\n是不是该把它卖了补贴家用？\n` + `或者放拍卖行骗几个自认为识货的人回本？”`);
            await data.setData("player", usr_qq, player);
            return;
        }
        await Add_najie_thing(usr_qq, "长相奇怪的小石头", "道具", -1);
        e.reply("你梳洗完毕，将小石头摆在案上,点上香烛，拜上三拜！")
        await sleep(3000);
        player.当前血量 = Math.floor(player.当前血量 / 3);
        player.血气 = Math.floor(player.血气 / 3);
        e.reply("小石头灵光一闪，化作一道精光融入你的体内。\n" + "你喷出一口瘀血，顿时感受到天地束缚弱了几分，可用轮回点+1");
        await sleep(1000);
        player.轮回点++;
        await data.setData("player", usr_qq, player);
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
        if (thing == "天地卡池") {
            let x = await exist_najie_thing(usr_qq, "天罗地网", "道具")
            if (!x) {
                e.reply("你没有【天罗地网】")
                return
            }
            if (x < 10) {
                e.reply("你没有足够的【天罗地网】")
                return
            }
            e.reply("十道金光从天而降")
            let msg = []
            let all = []
            await sleep(5000)
            for (var i = 0; 10 > i; i++) {
                let tianluoRandom = Math.floor(Math.random() * (data.xianchon.length - 20));
                tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
                msg.push("一道金光掉落在地上，走近一看是【" + data.xianchon[tianluoRandom].品级 + "】" + data.xianchon[tianluoRandom].name)
                await Add_仙宠(usr_qq, data.xianchon[tianluoRandom].name, 1)
                all.push("【" + data.xianchon[tianluoRandom].name + "】")
            }
            await Add_najie_thing(usr_qq, "天罗地网", "道具", -10)
            await ForwardMsg(e, msg)
            e.reply("恭喜获得\n" + all)
        }
        if (thing == "灵界卡池") {
            let x = await exist_najie_thing(usr_qq, "金丝仙网", "道具")
            if (!x) {
                e.reply("你没有【金丝仙网】")
                return
            }
            if (x < 10) {
                e.reply("你没有足够的【金丝仙网】")
                return
            }
            e.reply("十道金光从天而降")
            let msg = []
            let all = []
            await sleep(5000)
            for (var i = 0; 10 > i; i++) {
                let tianluoRandom = Math.floor(Math.random() * (data.xianchon.length - 30));
                tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
                msg.push("一道金光掉落在地上，走近一看是【" + data.xianchon[tianluoRandom].品级 + "】" + data.xianchon[tianluoRandom].name)
                await Add_仙宠(usr_qq, data.xianchon[tianluoRandom].name, 1)
                all.push("【" + data.xianchon[tianluoRandom].name + "】")
            }
            await Add_najie_thing(usr_qq, "金丝仙网", "道具", -10)
            await ForwardMsg(e, msg)
            e.reply("恭喜获得\n" + all)
        }
        if (thing == "凡界卡池") {
            let x = await exist_najie_thing(usr_qq, "银丝仙网", "道具")
            if (!x) {
                e.reply("你没有【银丝仙网】")
                return
            }
            if (x < 10) {
                e.reply("你没有足够的【银丝仙网】")
                return
            }
            e.reply("十道金光从天而降")
            let msg = []
            let all = []
            await sleep(5000)
            for (var i = 0; 10 > i; i++) {
                let tianluoRandom = Math.floor(Math.random() * (data.xianchon.length - 45));
                tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
                msg.push("一道金光掉落在地上，走近一看是【" + data.xianchon[tianluoRandom].品级 + "】" + data.xianchon[tianluoRandom].name)
                await Add_仙宠(usr_qq, data.xianchon[tianluoRandom].name, 1)
                all.push("【" + data.xianchon[tianluoRandom].name + "】")
            }
            await Add_najie_thing(usr_qq, "银丝仙网", "道具", -10)
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
        thing = thing.replace("抽", '');
        if (thing == "天地卡池") {
            let x = await exist_najie_thing(usr_qq, "天罗地网", "道具")
            if (!x) {
                e.reply("你没有【天罗地网】")
                return
            }
            await Add_najie_thing(usr_qq, "天罗地网", "道具", -1)
            let tianluoRandom = Math.floor(Math.random() * data.xianchon.length);
            tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
            console.log(tianluoRandom);
            e.reply("一道金光从天而降")
            await sleep(5000)
            e.reply("金光掉落在地上，走近一看是【" + data.xianchon[tianluoRandom].品级 + "】" + data.xianchon[tianluoRandom].name)
            await sleep(1000)
            await Add_仙宠(usr_qq, data.xianchon[tianluoRandom].name, 1)
            e.reply("恭喜获得" + data.xianchon[tianluoRandom].name)
        }
        if (thing == "灵界卡池") {
            let x = await exist_najie_thing(usr_qq, "金丝仙网", "道具")
            if (!x) {
                e.reply("你没有【金丝仙网】")
                return
            }
            await Add_najie_thing(usr_qq, "金丝仙网", "道具", -1)
            let tianluoRandom = Math.floor(Math.random() * (data.xianchon.length - 10));
            tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
            console.log(tianluoRandom);
            e.reply("一道金光从天而降")
            await sleep(5000)
            e.reply("金光掉落在地上，走近一看是【" + data.xianchon[tianluoRandom].品级 + "】" + data.xianchon[tianluoRandom].name)
            await sleep(1000)
            await Add_仙宠(usr_qq, data.xianchon[tianluoRandom].name, 1)
            e.reply("恭喜获得" + data.xianchon[tianluoRandom].name)
        }
        if (thing == "凡界卡池") {
            let x = await exist_najie_thing(usr_qq, "银丝仙网", "道具")
            if (!x) {
                e.reply("你没有【银丝仙网】")
                return
            }
            await Add_najie_thing(usr_qq, "银丝仙网", "道具", -1)
            let tianluoRandom = Math.floor(Math.random() * (data.xianchon.length - 29));
            tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
            console.log(tianluoRandom);
            e.reply("一道金光从天而降")
            await sleep(5000)
            e.reply("金光掉落在地上，走近一看是【" + data.xianchon[tianluoRandom].品级 + "】" + data.xianchon[tianluoRandom].name)
            await sleep(1000)
            await Add_仙宠(usr_qq, data.xianchon[tianluoRandom].name, 1)
            e.reply("恭喜获得" + data.xianchon[tianluoRandom].name)
        }
    }

    async refining(e) {
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
        thing = thing.replace("精炼", '');
        let code = thing.split("\*");
        thing = code[0]
        let thing_pinji = code[1]//品级
        if (thing == "") {
            e.reply("未输入名称")
            return;
        }
        let najie = await Read_najie(usr_qq)
        let pinji_number = 114514
        let pinji = ['劣', '普', '优', '精', '极', '绝', '顶']
        for (var i = 0; pinji.length > i; i++) {
            if (thing_pinji == pinji[i]) {
                pinji_number = i
                console.log("找到了")
                break
            }
        }
        if (pinji_number == 114514) {
            e.reply("未输入品级")
            return
        }
        if (pinji_number == 6) {
            e.reply("已达到顶级")
            return
        }
        //判断戒指中是否存在
        let thing_quantity = await exist_najie_thing(usr_qq, thing, "装备");
        if (!thing_quantity) {//没有
            e.reply(`你没有[${thing}]这样的装备`);
            return;
        }
        let thing_quantity2 = najie.装备.find(item => item.name == thing && item.pinji == pinji_number)
        if (!isNotNull(thing_quantity2)) {
            e.reply("你没有" + thing_pinji + "的装备")
            return
        } else {
            thing_quantity2 = thing_quantity2.数量
        }
        let thing_aconut_need = [3, 3, 3, 3, 3, 3]//每个阶级所需数量，可diy
        let thing_acunot = thing_aconut_need[pinji_number]
        if (thing_quantity2 < thing_acunot) {//不够
            e.reply(`你目前只有[${thing}【${pinji[najie.装备.find(item => item.name == thing && item.pinji == pinji_number).pinji]}】]*${thing_quantity2}`) + "还需" + thing_acunot - thing_quantity2 + '件方可精炼';
            return;
        }
        //都通过了
        await Add_najie_thing(usr_qq, thing, "装备", -thing_acunot, pinji_number)
        await Add_najie_thing(usr_qq, thing, "装备", 1, pinji_number + 1)
        e.reply("精炼成功获得" + thing + "【" + pinji[pinji_number + 1] + "】*1")
        return
    }

    async find_thing(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        var reg = new RegExp(/哪里有/);
        let msg = e.msg.replace(reg, '');
        msg = msg.replace("#", '');
        let thing_name = msg.replace("哪里有", '');
        let weizhi = [];
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`你在瞎说啥呢?哪来的【${thing_name}】?`);
            return;
        }
        let number = await exist_najie_thing(usr_qq, "寻物纸", "道具")
        if (!number) {
            e.reply("查找物品需要【寻物纸】");
            return;
        }
        weizhi.push("秘境：");
        for1: for (var i = 0; i < data.didian_list.length; i++) {
            for (var j = 0; j < data.didian_list[i].one.length; j++) {
                if (thing_name == data.didian_list[i].one[j].name) {
                    weizhi.push(data.didian_list[i].name);
                    weizhi.push(" ");
                    continue for1;
                }
            }
            for (var j = 0; j < data.didian_list[i].two.length; j++) {
                if (thing_name == data.didian_list[i].two[j].name) {
                    weizhi.push(data.didian_list[i].name);
                    weizhi.push(" ");
                    continue for1;
                }
            }
            for (var j = 0; j < data.didian_list[i].three.length; j++) {
                if (thing_name == data.didian_list[i].three[j].name) {
                    weizhi.push(data.didian_list[i].name);
                    weizhi.push(" ");
                    continue for1;
                }
            }
        }
        weizhi.push('\n');
        weizhi.push("禁地：");
        for4: for (var i = 0; i < data.forbiddenarea_list.length; i++) {
            for (var j = 0; j < data.forbiddenarea_list[i].one.length; j++) {
                if (thing_name == data.forbiddenarea_list[i].one[j].name) {
                    weizhi.push(data.forbiddenarea_list[i].name);
                    weizhi.push(" ");
                    continue for4;
                }
            }
            for (var j = 0; j < data.forbiddenarea_list[i].two.length; j++) {
                if (thing_name == data.forbiddenarea_list[i].two[j].name) {
                    weizhi.push(data.forbiddenarea_list[i].name);
                    weizhi.push(" ");
                    continue for4;
                }
            }
            for (var j = 0; j < data.forbiddenarea_list[i].three.length; j++) {
                if (thing_name == data.forbiddenarea_list[i].three[j].name) {
                    weizhi.push(data.forbiddenarea_list[i].name);
                    weizhi.push(" ");
                    continue for4;
                }
            }
        }
        weizhi.push('\n');
        weizhi.push("宗门秘境：");
        for5: for (var i = 0; i < data.guildSecrets_list.length; i++) {
            for (var j = 0; j < data.guildSecrets_list[i].one.length; j++) {
                if (thing_name == data.guildSecrets_list[i].one[j].name) {
                    weizhi.push(data.guildSecrets_list[i].name);
                    weizhi.push(" ");
                    continue for5;
                }
            }
            for (var j = 0; j < data.guildSecrets_list[i].two.length; j++) {
                if (thing_name == data.guildSecrets_list[i].two[j].name) {
                    weizhi.push(data.guildSecrets_list[i].name);
                    weizhi.push(" ");
                    continue for5;
                }
            }
            for (var j = 0; j < data.guildSecrets_list[i].three.length; j++) {
                if (thing_name == data.guildSecrets_list[i].three[j].name) {
                    weizhi.push(data.guildSecrets_list[i].name);
                    weizhi.push(" ");
                    continue for5;
                }
            }
        }
        weizhi.push('\n');
        weizhi.push("仙境：");
        for2: for (var i = 0; i < data.Fairyrealm_list.length; i++) {
            for (var j = 0; j < data.Fairyrealm_list[i].one.length; j++) {
                if (thing_name == data.Fairyrealm_list[i].one[j].name) {
                    weizhi.push(data.Fairyrealm_list[i].name);
                    weizhi.push(" ");
                    continue for2;
                }
            }
            for (var j = 0; j < data.Fairyrealm_list[i].two.length; j++) {
                if (thing_name == data.Fairyrealm_list[i].two[j].name) {
                    weizhi.push(data.Fairyrealm_list[i].name);
                    weizhi.push(" ");
                    continue for2;
                }
            }
            for (var j = 0; j < data.Fairyrealm_list[i].three.length; j++) {
                if (thing_name == data.Fairyrealm_list[i].three[j].name) {
                    weizhi.push(data.Fairyrealm_list[i].name);
                    weizhi.push(" ");
                    continue for2;
                }
            }
        }
        weizhi.push('\n');
        weizhi.push("仙府：");
        for3: for (var i = 0; i < data.timeplace_list.length; i++) {
            for (var j = 0; j < data.timeplace_list[i].one.length; j++) {
                if (thing_name == data.timeplace_list[i].one[j].name) {
                    weizhi.push(data.timeplace_list[i].name);
                    weizhi.push(" ");
                    continue for3;
                }
            }
            for (var j = 0; j < data.timeplace_list[i].two.length; j++) {
                if (thing_name == data.timeplace_list[i].two[j].name) {
                    weizhi.push(data.timeplace_list[i].name);
                    weizhi.push(" ");
                    continue for3;
                }
            }
            for (var j = 0; j < data.timeplace_list[i].three.length; j++) {
                if (thing_name == data.timeplace_list[i].three[j].name) {
                    weizhi.push(data.timeplace_list[i].name);
                    weizhi.push(" ");
                    continue for3;
                }
            }
        }
        weizhi.push('\n');
        weizhi.push("盒子：");
        for6: for (var i = 0; i < data.hezi_list.length; i++) {
            for (var j = 0; j < data.hezi_list[i].contents.length; j++) {
                for (var k = 0; k < data.hezi_list[i].contents[j].items.length; k++) {
                    if (thing_name == data.hezi_list[i].contents[j].items[k].name) {
                        weizhi.push(data.hezi_list[i].name);
                        weizhi.push(" ");
                        continue for6;
                    }
                }
            }
        }
        weizhi.push('\n');
        weizhi.push("其他：");
        for (var i = 0; i < data.commodities_list.length; i++) {
            if (thing_name == data.commodities_list[i].name) {
                weizhi.push("柠檬堂");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.cangbaoge_list.length; i++) {
            if (thing_name == data.cangbaoge_list[i].name) {
                weizhi.push("藏宝阁");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.danyao_list.length; i++) {
            if (thing_name == data.danyao_list[i].name) {
                weizhi.push("神兽赐福(麒麟)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.gongfa_list.length; i++) {
            if (thing_name == data.gongfa_list[i].name) {
                weizhi.push("神兽赐福(青龙)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.huju_list.length; i++) {
            if (thing_name == data.huju_list[i].name) {
                weizhi.push("神兽赐福(玄武)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.fabao_list.length; i++) {
            if (thing_name == data.fabao_list[i].name) {
                weizhi.push("神兽赐福(朱雀)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.wuqi_list.length; i++) {
            if (thing_name == data.wuqi_list[i].name) {
                weizhi.push("神兽赐福(白虎)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.qinlong.length; i++) {
            if (thing_name == data.qinlong[i].name) {
                weizhi.push("神兽赐福(青龙)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.qilin.length; i++) {
            if (thing_name == data.qilin[i].name) {
                weizhi.push("神兽赐福(麒麟)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.xuanwu.length; i++) {
            if (thing_name == data.xuanwu[i].name) {
                weizhi.push("神兽赐福(玄武、朱雀、白虎)");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.sanbin.length; i++) {
            if (thing_name == data.sanbin[i].name) {
                weizhi.push("boss掉落");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.wuqizaohua.length; i++) {
            if (thing_name == data.wuqizaohua[i].name) {
                weizhi.push("武器造化机缘");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.hujuzaohua.length; i++) {
            if (thing_name == data.hujuzaohua[i].name) {
                weizhi.push("护具造化机缘");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.fabaozaohua.length; i++) {
            if (thing_name == data.fabaozaohua[i].name) {
                weizhi.push("法宝造化机缘");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.bapin.length; i++) {
            if (thing_name == data.bapin[i].name) {
                weizhi.push("残卷兑换");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.tuzhi_list.length; i++) {
            if (thing_name == data.tuzhi_list[i].name) {
                weizhi.push("图纸锻造");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.danfang_list.length; i++) {
            if (thing_name == data.danfang_list[i].name) {
                weizhi.push("丹药配方");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.tianditang.length; i++) {
            if (thing_name == data.tianditang[i].name) {
                weizhi.push("天地堂");
                weizhi.push(" ");
                break;
            }
        }
        for (var i = 0; i < data.xingge.length; i++) {
            if (thing_name == data.xingge[i].name) {
                weizhi.push("星阁");
                weizhi.push(" ");
                break;
            }
        }
        weizhi.push('\n');
        weizhi.push("消耗了一张寻物纸,");
        if (weizhi.length == 15) {
            e.reply("天地没有回应......");
        } else {
            await e.reply(weizhi);
        }
        await Add_najie_thing(usr_qq, "寻物纸", "道具", -1);
        return;
    }

    async heavenly(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        await Go(e);
        if (allaction) {
            console.log(allaction);
        } else {
            return;
        }
        allaction = false;
        let number = await exist_najie_thing(usr_qq, "[无主的神之心]", "道具")
        if (number > 6) {
            await Add_najie_thing(usr_qq, "[无主的神之心]", "道具", -7)
            await Add_najie_thing(usr_qq, "神迹之礼", "盒子", 1)
            e.reply('一道刺眼的金光落下直接砸晕了你,醒来时不知过去了多久,你发现你手里的神之心都消失了,身边出现了一个隐隐冒着金光的盒子,上面刻着[神迹之礼]')
            return
        } else {
            e.reply("天理没有回应.....")
            return
        }
    }

    //存取灵石
    async Take_lingshi(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        await Go(e);
        if (allaction) {
            console.log(allaction);
        } else {
            return;
        }
        allaction = false;
        //检索方法
        var reg = new RegExp(/取|存/);
        let func = reg.exec(e.msg);
        let msg = e.msg.replace(reg, '');
        msg = msg.replace("#", '');
        let lingshi = msg.replace("灵石", '');
        if (func == "存" && lingshi == "全部") {
            let P = await Read_player(usr_qq);
            lingshi = P.灵石;
        }
        if (func == "取" && lingshi == "全部") {
            let N = await Read_najie(usr_qq);
            lingshi = N.灵石
        }
        if (parseInt(lingshi) != parseInt(lingshi)) {
            e.reply([segment.at(usr_qq), `请在指令后面加上灵石数量`]);
            return;
        } else {
            lingshi = parseInt(lingshi);
            if (lingshi < 1) {
                e.reply([segment.at(usr_qq), `灵石数量不能为负数`]);
                return;
            }
        }
        if (func == "存") {
            let player_lingshi = await Read_player(usr_qq);
            player_lingshi = player_lingshi.灵石;
            if (player_lingshi < lingshi) {
                e.reply([segment.at(usr_qq), `灵石不足,你目前只有${player_lingshi}灵石`]);
                return;
            }
            let najie = await Read_najie(usr_qq);
            if (najie.灵石上限 < najie.灵石 + lingshi) {
                await Add_najie_灵石(usr_qq, najie.灵石上限 - najie.灵石);
                await Add_灵石(usr_qq, -najie.灵石上限 + najie.灵石);
                e.reply([segment.at(usr_qq), `已为您放入${najie.灵石上限 - najie.灵石}灵石,纳戒存满了`]);
                return;
            }
            await Add_najie_灵石(usr_qq, lingshi);
            await Add_灵石(usr_qq, -lingshi);
            e.reply([segment.at(usr_qq), `储存完毕,你目前还有${player_lingshi - lingshi}灵石,纳戒内有${najie.灵石 + lingshi}灵石`]);
            return;
        }
        if (func == "取") {
            let najie = await Read_najie(usr_qq);
            if (najie.灵石 < lingshi) {
                e.reply([segment.at(usr_qq), `纳戒灵石不足,你目前最多取出${najie.灵石}灵石`]);
                return;
            }
            let player_lingshi = await Read_player(usr_qq);
            player_lingshi = player_lingshi.灵石;
            await Add_najie_灵石(usr_qq, -lingshi);
            await Add_灵石(usr_qq, lingshi);
            e.reply([segment.at(usr_qq), `本次取出灵石${lingshi},你的纳戒还剩余${najie.灵石 - lingshi}灵石`]);
            return;
        }
        return;
    }

    //#(装备|服用|消耗)物品*数量
    async Player_use(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = await Read_player(usr_qq);
        let najie = await Read_najie(usr_qq);
        //检索方法
        var reg = new RegExp(/装备|服用|消耗|学习|打开|解除封印|寻宝/);
        let func = reg.exec(e.msg);
        let msg = e.msg.replace(reg, '');
        msg = msg.replace("#", '');
        let code = msg.split("\*");
        let thing_name = code[0];
        let quantity=code[1];
        if (quantity < 1 || quantity == null || quantity == undefined || quantity == NaN) {
            quantity = 1;
        } else {
            quantity = code[1].replace(/[^0-9]/ig, "");
        }
        if (quantity < 1 || quantity == null || quantity == undefined || quantity == NaN) {
            quantity = 1;
        }
        //看看物品名称有没有设定,是不是瞎说的
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`你在瞎说啥呢?哪来的【${thing_name}】?`);
            return;
        }
        if (func == "装备") {
            let x;
            let pj = {
                "劣": 0,
                "普": 1,
                "优": 2,
                "精": 3,
                "极": 4,
                "绝": 5,
                "顶": 6
            }
            if (code[1]==undefined)
            {
                x = await exist_najie_thing(usr_qq, thing_name, "装备");
            }
            else
            {
                pj = pj[code[1]];
                if (pj==undefined) return; 
                x = await exist_najie_thing(usr_qq, thing_name, "装备", pj);
            }
            if (!x) {//没有
                e.reply(`你没有【${thing_name}】这样的装备`);
                return;
            }
            let equ;
            if (code[1]==undefined)
            {
                equ = najie.装备.find(item => item.name == thing_name);
                for (var i = 0; i<najie.装备.length; i++) {//遍历列表有没有比那把强的
                    if (najie.装备[i].name == thing_name && najie.装备[i].pinji > equ.pinji) {
                        equ = najie.装备[i];
                    }
                }
            }
            else
            {
                equ = najie.装备.find(item => item.name == thing_name && item.pinji==pj);
            }
            var equipment = await Read_equipment(usr_qq);
            if (equ.type == "项链") {
                if (equ.属性 == "幸运") {
                    player.幸运 -= equipment.项链.加成
                }
            }
            await instead_equipment(usr_qq, equ);
            let img = await get_equipment_img(e);
            equipment = await Read_equipment(usr_qq);
            if (equipment.武器.name == "灭仙剑" && equipment.法宝.name == "灭仙符" && equipment.护具.name == "灭仙衣" && player.魔道值 > 999) {
                e.reply("你已激活灭仙三件套效果");
            }
            if (equipment.武器.name == "诛仙枪" && equipment.法宝.name == "诛仙花" && equipment.护具.name == "诛仙甲" && player.魔道值 > 999) {
                e.reply("你已激活诛仙三件套效果");
            }
            if (equipment.武器.name == "光明剑" && equipment.法宝.name == "光明符" && equipment.护具.name == "光明衣" && player.魔道值 < 1 && (player.灵根.type == "转生" || player.level_id > 41)) {
                e.reply("你已激活光明三件套效果");
            }
            if (equipment.武器.name == "神月剑" && equipment.法宝.name == "神日花" && equipment.护具.name == "神星甲" && player.魔道值 < 1 && (player.灵根.type == "转生" || player.level_id > 41)) {
                e.reply("你已激活日月三件套效果");
            }
            e.reply(img);
            return;
        }
        if (func == "服用") {
            let action = await redis.get("xiuxian:player:" + 10 + ":biguang");
            action = await JSON.parse(action);
            let x = await exist_najie_thing(usr_qq, thing_name, "丹药");
            if (!x) {//没有
                e.reply(`你没有【${thing_name}】这样的丹药`);
                return;
            }
            //这里要找到丹药
            let this_danyao;
            try {
                this_danyao = data.danyao_list.find(item => item.name == thing_name)
                    || data.newdanyao_list.find(item => item.name == thing_name);
                try {
                    if (this_danyao == undefined) {
                        this_danyao = data.timedanyao_list.find(item => item.name == thing_name);
                    }
                } catch {
                    this_danyao = data.timedanyao_list.find(item => item.name == thing_name);
                }
            } catch {
                this_danyao = data.timedanyao_list.find(item => item.name == thing_name);
            }
            if ((this_danyao.type == "幸运" || this_danyao.type == "补天" || this_danyao.type == "补根") && quantity > 1) {
                e.reply("说明书上写了：本丹药一次仅能服用一枚！");
                quantity = 1;
            }
            if (x < quantity) {//不够
                e.reply(`你目前只有【${thing_name}】*${x},数量不够`);
                return;
            }
            await Add_najie_thing(usr_qq, thing_name, "丹药", -quantity);
            if (this_danyao.type == "血量") {
                await Go(e);
                if (allaction) {
                    console.log(allaction);
                } else {
                    return;
                }
                allaction = false;
                let player = await Read_player(usr_qq);
                if (!isNotNull(this_danyao.HPp)) {
                    this_danyao.HPp = 1
                }
                let blood = parseInt(player.血量上限 * this_danyao.HPp + this_danyao.HP);
                await Add_HP(usr_qq, quantity * blood);
                let now_HP = await Read_player(usr_qq);
                e.reply(`服用成功,当前血量为:${now_HP.当前血量} `);
                return;
            }
            if (this_danyao.type == "修为") {
                await Add_修为(usr_qq, quantity * this_danyao.exp);
                e.reply(`服用成功,修为增加${quantity * this_danyao.exp}`);
                return;
            }
            if (this_danyao.type == "血气") {
                await Add_血气(usr_qq, quantity * this_danyao.xueqi);
                e.reply(`服用成功,血气增加${quantity * this_danyao.xueqi}`);
                return;
            }
            if (this_danyao.type == "幸运") {
                if (player.islucky > 0) {
                    e.reply("目前尚有福源丹在发挥效果，身体无法承受更多福源");
                    await Add_najie_thing(usr_qq, thing_name, "丹药", quantity);
                    return;
                }
                player.islucky = 10;
                player.addluckyNo = this_danyao.xingyun;
                player.幸运 += this_danyao.xingyun;
                await data.setData("player", usr_qq, player);
                e.reply(`${thing_name}服用成功，将在之后的 10 次冒险旅途中为你提高幸运值！`);
                return;
            }
            if (this_danyao.type == '闭关') {
                for (i = 0; i < action.length; i++) {
                    if (action[i].qq == usr_qq) {
                        if (action[i].biguan > 0) {
                            await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);
                            e.reply(`上次服用的药效还没过,等以后再服用吧`);
                            return;
                        }
                        if (action[i].biguan.typeof != Number || action[i].biguan < 0) {
                            action[i].biguan = quantity;
                        } else {
                            action[i].biguan += quantity;
                        }
                        action[i].biguanxl += this_danyao.biguan;
                        player.修炼效率提升 += action[i].biguanxl;
                        e.reply(
                            `${thing_name}提高了你的忍耐力,提高了下次闭关的效率,当前提高${
                            action[i].biguanxl * 100
                            }%`
                        );
                    }
                }
                await redis.set(
                    'xiuxian:player:' + 10 + ':biguang',
                    JSON.stringify(action)
                );
                await data.setData('player', usr_qq, player);

                return;
            }
            if (this_danyao.type == "仙缘") {

                if (quantity != 1) {
                    e.reply(`只能服用一枚仙缘丹哦`)
                    await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);
                    return
                }
                for (i = 0; i < action.length; i++) {
                    if (action[i].qq == usr_qq) {
                        if (action[i].ped <= 0 || action[i].ped.typeof != Number) { action[i].ped = 5 }
                        else {
                            console.log(action[i].ped);
                            e.reply(`还有药力剩余,等使用完再服用吧`)
                            await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);
                            return
                        }
                        action[i].beiyong1 += this_danyao.gailv
                    }
                }
                await redis.set("xiuxian:player:" + 10 + ":biguang", JSON.stringify(action))

                await data.setData("player", usr_qq, player);
                e.reply(`${thing_name}赐予${player.名号}仙缘,${player.名号}得到了仙兽的祝福`)
                return;
            }
            if (this_danyao.type == '凝仙') {
                for (i = 0; i < action.length; i++) {
                    if (action[i].qq == usr_qq) {

                        if (action[i].biguan > 0) { action[i].biguan += this_danyao.机缘 * quantity }
                        if (action[i].lianti > 0) { action[i].lianti += this_danyao.机缘 * quantity }
                        if (action[i].ped > 0) { action[i].ped += this_danyao.机缘 * quantity }
                        console.log(this_danyao.机缘);
                        e.reply(`丹韵入体,身体内蕴含的仙丹药效增加了${this_danyao.机缘 * quantity}次`)
                        await redis.set("xiuxian:player:" + 10 + ":biguang", JSON.stringify(action))
                    }
                }
                return;
            }


            if (this_danyao.type == '炼神') {
                if (quantity != 1) {
                    e.reply(`一次闭关只能拥有一条炼神之力`);
                    await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);

                    return;
                }
                for (i = 0; i < action.length; i++) {
                    if (action[i].qq == usr_qq) {
                        if (action[i].lianti != 0) {
                            e.reply(`已经拥有一道炼神之力了,身体无法承受第二道炼神之力`);
                            await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);
                            return;
                        }
                        if (action[i].lianti > 0) { }
                        else {
                            action[i].lianti = 1;
                            action[i].beiyong4 = this_danyao.lianshen
                            await redis.set(
                                'xiuxian:player:' + 10 + ':biguang',
                                JSON.stringify(action)
                            );
                            e.reply(
                                `服用了${thing_name},获得了炼神之力,下次闭关获得了炼神之力,当前炼神之力为${
                                this_danyao.lianshen * 100
                                }%`
                            );
                            return;
                        }
                    }
                }
            }
            if (this_danyao.type == '神赐') {
                for (i = 0; i < action.length; i++) {
                    if (action[i].qq == usr_qq) {
                        if (action[i].beiyong2 > 0) {
                            action[i].beiyong2 += quantity
                        }
                        else {
                            action[i].beiyong2 = quantity
                        }
                        action[i].beiyong3 = this_danyao.概率
                        e.reply(`${player.名号}获得了神兽的恩赐,赐福的概率增加了,当前剩余次数${action[i].beiyong2}`)
                        await redis.set("xiuxian:player:" + 10 + ":biguang", JSON.stringify(action))
                        console.log(action[i]);
                    }

                }

            }
            if (this_danyao.type == '灵根') {
                change_神之心(usr_qq)
                e.reply(`异界的力量汇涌入${player.名号}的体内,${player.名号}获得了七神的祝福`)
            }
            if (this_danyao.type == '魔道值') {
                await Add_魔道值(usr_qq, -quantity * this_danyao.modao);
                e.reply(`获得了转生之力,降低了${quantity * this_danyao.modao}魔道值`);
                return;
            }
            if (this_danyao.type == '入魔') {
                await Add_魔道值(usr_qq, quantity * this_danyao.modao);
                e.reply(`${quantity}道黑色魔气入体,增加了${quantity * this_danyao.modao}魔道值`);
                return;
            }

            if (this_danyao.type == "补根") {
                if (player.lunhui != 0) {
                    let lhxg = await redis.get("xiuxian:player:" + usr_qq + ":Player_use");
                    if (lhxg != 3) {
                        e.reply("使用【洗根水】【补天丹】【补根丹】进行洗髓将清除轮回状态！\n回复:【确认补根】或者【取消】进行选择");
                        await Add_najie_thing(usr_qq, "补根丹", "丹药", quantity);
                        this.setContext('yesxigen');
                        return;
                    } else if (lhxg == 3) {
                        await redis.set("xiuxian:player:" + usr_qq + ":Player_use", 0);
                    }
                    let gongfa = ["一转轮回", "二转轮回", "三转轮回", "四转轮回", "五转轮回", "六转轮回", "七转轮回", "八转轮回", "九转轮回"];
                    for (let i = 0; i < player.lunhui; i++) {
                        let x = await exist_najie_thing(usr_qq, gongfa[i], "功法");
                        if (!x) {
                            await Reduse_player_学习功法(usr_qq, gongfa[i]);
                        }
                        await Add_najie_thing(usr_qq, gongfa[i], "功法", -1);
                    }
                    player.lunhui = 0;
                }
                player.灵根 = {
                    "id": 70001, "name": "垃圾五灵根", "type": "伪灵根", "eff": 0.01, "法球倍率": 0.01
                };
                await data.setData("player", usr_qq, player);
                e.reply(`服用成功,当前灵根为垃圾五灵根,你具备了称帝资格`);
                return;
            }
            if (this_danyao.type == "补天") {
                if (player.lunhui != 0) {
                    let lhxg = await redis.get("xiuxian:player:" + usr_qq + ":Player_use");
                    if (lhxg != 2) {
                        e.reply("使用【洗根水】【补天丹】【补根丹】进行洗髓将清除轮回状态！\n回复:【确认补天】或者【取消】进行选择");
                        await Add_najie_thing(usr_qq, "补天丹", "丹药", quantity);
                        this.setContext('yesxigen');
                        return;
                    } else if (lhxg == 2) {
                        await redis.set("xiuxian:player:" + usr_qq + ":Player_use", 0);
                    }
                    let gongfa = ["一转轮回", "二转轮回", "三转轮回", "四转轮回", "五转轮回", "六转轮回", "七转轮回", "八转轮回", "九转轮回"];
                    for (let i = 0; i < player.lunhui; i++) {
                        let x = await exist_najie_thing(usr_qq, gongfa[i], "功法");
                        if (!x) {
                            await Reduse_player_学习功法(usr_qq, gongfa[i]);
                        }
                        await Add_najie_thing(usr_qq, gongfa[i], "功法", -1);
                    }
                    player.lunhui = 0;
                }
                player.灵根 = {
                    "id": 70054, "name": "天五灵根", "type": "圣体", "eff": 0.20, "法球倍率": 0.12
                };
                await data.setData("player", usr_qq, player);
                e.reply(`服用成功,当前灵根为天五灵根,你具备了称帝资格`);
                return;
            }
            if (this_danyao.type == "突破") {
                if (player.breakthrough == true) {
                    await Add_najie_thing(usr_qq, "破境丹", "丹药", 1)
                    e.reply(`你已经吃过破境丹了`)
                    return;
                } else {
                    player.breakthrough = true;
                    await data.setData("player", usr_qq, player);
                    e.reply(`服用成功,下次突破概率增加20%`);
                    return;
                }
            }
        }
        if (func == "消耗") {
            let thing = data.daoju_list.find(item => item.name == thing_name);
            let x = await exist_najie_thing(usr_qq, thing_name, "道具");
            let y = await exist_najie_thing(usr_qq, thing_name, "草药");
            let z = await exist_najie_thing(usr_qq, thing_name, "装备");
            if (!x && !y && !z) {
                e.reply(`你没有【${thing_name}】这样的道具`);
                return;
            }
            if(thing.type=="练气幻影卡面"){
                let photo=thing.id
                if(player.练气皮肤==photo){
                    e.reply("您的卡面已经是"+thing.name)
                    return
                }
                let old=data.daoju_list.find(item=>item.id==player.练气皮肤)
                player.练气皮肤=photo
                await Write_player(usr_qq,player)
                await Add_najie_thing(usr_qq,thing_name,"道具",-1)
                await Add_najie_thing(usr_qq,old.name,"道具",1)
                e.reply("更换"+thing.type+"【"+thing.name+"】成功")
                return
                
            }
            if(thing.type=="装备幻影卡面"){
                let photo=thing.id
                if(player.装备皮肤==photo){
                    e.reply("您的卡面已经是"+thing.name)
                    return
                }
                let old=data.daoju_list.find(item=>item.id==player.装备皮肤)
                player.装备皮肤=photo
                await Write_player(usr_qq,player)
                await Add_najie_thing(usr_qq,thing_name,"道具",-1)
                await Add_najie_thing(usr_qq,old.name,"道具",1)
                e.reply("更换"+thing.type+"【"+thing.name+"】成功")
                return
                
            }
            let najie = await Read_najie(usr_qq)
            let ifexist = najie.草药.find(item => item.name == thing_name);
            if (isNotNull(ifexist)) {
                if (ifexist.name == "圣令" || ifexist.type == "分数") {
                    await Add_najie_thing(usr_qq, "【剑法】残云封天剑", "装备", 1);
                    await Add_najie_thing(usr_qq, thing_name, "草药", -1);
                    e.reply(`成功兑换武器：《【剑法】残云封天剑》`);
                    return
                }
            }
            ifexist = najie.道具.find(item => item.name == thing_name);
            if (isNotNull(ifexist)) {
                if (ifexist.name == "圣令") {
                    await Add_najie_thing(usr_qq, "四圣麒麟甲", "装备", 1);
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    e.reply(`成功兑换：四圣麒麟甲`);
                    return
                }
            }
            ifexist = najie.装备.find(item => item.name == thing_name);
            if (isNotNull(ifexist)) {
                if (ifexist.name == "武器造化机缘") {
                    let l = data.wuqizaohua
                    let rn = Math.floor(Math.random() * l.length + 1)
                    let th = l[rn].name
                    await Add_najie_thing(usr_qq, th, "装备", 1);
                    await Add_najie_thing(usr_qq, thing_name, "装备", -1);
                    e.reply(`成功兑换：` + th);
                    return
                }
                if (ifexist.name == "护具造化机缘") {
                    let l = data.hujuzaohua
                    let rn = Math.floor(Math.random() * l.length + 1)
                    let th = l[rn].name
                    await Add_najie_thing(usr_qq, th, "装备", 1);
                    await Add_najie_thing(usr_qq, thing_name, "装备", -1);
                    e.reply(`成功兑换：` + th);
                    return
                }
                if (ifexist.name == "法宝造化机缘") {
                    let l = data.fabaozaohua
                    let rn = Math.floor(Math.random() * l.length + 1)
                    let th = l[rn].name
                    await Add_najie_thing(usr_qq, th, "装备", 1);
                    await Add_najie_thing(usr_qq, thing_name, "装备", -1);
                    e.reply(`成功兑换：` + th);
                    return
                }
            }
            if (thing_name == "多莉的消息") {
                e.reply([segment.at(3140947982), "多莉！！来客人了！！"])
                await Add_najie_thing(usr_qq, "多莉的消息", "道具", -1);
                return
            }
            if (thing_name == "闹钟呼唤器") {
                e.reply([segment.at(1564856979), "闹钟！！有人找你"])
                await Add_najie_thing(usr_qq, "闹钟呼唤器", "道具", -1);
                return
            }
         if (thing_name == "寻宝工具盒") {
            let chanzi=Math.round(Math.random()*13)
            let shuliang=Math.round(Math.random()*4)
            if(quantity<2){
            if(shuliang>0){
            if(chanzi>0&&chanzi<4){
            await Add_najie_thing(usr_qq, "木铲", "道具", shuliang);
            await Add_najie_thing(usr_qq, thing_name, "道具", -1);
            e.reply(["你打开了"+thing_name+"发现了木铲，获得木铲"+shuliang+"个"])
            return}
            if(chanzi>3&&chanzi<7){
            await Add_najie_thing(usr_qq, "石铲", "道具", shuliang);
            await Add_najie_thing(usr_qq, thing_name, "道具", -1);
            e.reply(["你打开了"+thing_name+"发现了石铲，获得石铲"+shuliang+"个"])
            return}
            if(chanzi>6&&chanzi<9){
            await Add_najie_thing(usr_qq, "铁铲", "道具", shuliang);
            await Add_najie_thing(usr_qq, thing_name, "道具", -1);
            e.reply(["你打开了"+thing_name+"发现了铁铲，获得铁铲"+shuliang+"个"])
            return}
            if(chanzi>8&&chanzi<11){
            await Add_najie_thing(usr_qq, "洛阳铲", "道具", shuliang);
            await Add_najie_thing(usr_qq, thing_name, "道具", -1);
            e.reply(["你打开了"+thing_name+"发现了洛阳铲，获得洛阳铲"+shuliang+"个"])
            return}
            if(chanzi>10&&chanzi<12){
            await Add_najie_thing(usr_qq, "钻石铲", "道具", shuliang);
            await Add_najie_thing(usr_qq, thing_name, "道具", -1);
            e.reply(["你打开了"+thing_name+"发现了钻石铲，获得钻石铲"+shuliang+"个"])
            return}
            else{
            await Add_najie_thing(usr_qq, "未点燃的火把", "道具", shuliang);
            await Add_najie_thing(usr_qq, thing_name, "道具", -1);
            e.reply("你兴致勃勃的打开了这个盒子，结果只找到了几根未点燃的火把")
            return
            }
        }else{
            await Add_najie_thing(usr_qq, "玩具铲", "道具", 1);
            await Add_najie_thing(usr_qq, thing_name, "道具", -1);
            e.reply("你充满期待的打开了盒子，结果发现只是小孩的恶作剧，获得了玩具铲1个")
            return
            }
            }
            else{
            e.reply("因为寄术原因一次只能开启一个！")
            return
            }
            }
            //寄术原因，写了很多多余的东西，但是能跑
            if (thing_name == "猫猫藏的新春礼盒") {
                let cishu=Math.round(Math.random()*7);
                if(quantity<2){
                if(cishu>0&&cishu<4){
                    await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", 1);
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    e.reply(["你打开了"+thing_name+"发现了雪铃零藏的新春木盒，获得雪铃零藏的新春木盒1个"])
                    return;
                }else if(cishu>4&&cishu<7){
                    await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", 1);
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);   
                    e.reply(["你打开了"+thing_name+"发现了闹钟藏的新春铁盒，获得闹钟藏的新春铁盒1个"])
                    return;
                }else if(cishu==7){
                    await Add_灵石(usr_qq, 2000000);
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);  
                    e.reply("你打开了"+thing_name+",里面有一袋灵石")
                }else{
                    
                await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                e.reply("你打开了"+thing_name+"什么也没有发现")
                return;
                }
                }else{
                    e.reply("因为寄术原因一次只能开启一个！")
                    return
                }
            }
            if (thing_name == "打火石") {
                let huoshi = await exist_najie_thing(usr_qq, "打火石", "道具")
                let number = await exist_najie_thing(usr_qq, "未点燃的火把", "道具")
                if (isNotNull(huoshi) && huoshi > 1*quantity-1){
                if (isNotNull(number) && number > 5*quantity-1){
                await Add_najie_thing(usr_qq, "火把", "道具", 5*quantity);
                await Add_najie_thing(usr_qq, "未点燃的火把", "道具", -5*quantity);
                await Add_najie_thing(usr_qq, "打火石", "道具", -quantity);
                e.reply(["你使用打火石点燃了火把，获得火把"+5*quantity+"个"])
                return
                }else {
                    e.reply("你的未点燃的火把不足"+5*quantity+"个，你感觉太亏了，便放弃了")
                    return
                }
            }else{
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }    
            if (thing_name == "钻石尘埃") {
                let number = await exist_najie_thing(usr_qq, thing_name, "道具")
                if (isNotNull(number) && number > 3*quantity-1){
                await Add_najie_thing(usr_qq, "钻石微粒", "道具", 1*quantity);
                await Add_najie_thing(usr_qq, thing_name, "道具", -3*quantity);
                e.reply(["合成成功，获得钻石微粒"+quantity+"个"])
                return
                }
                else {
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }    
            if (thing_name == "钻石微粒") {
                let number = await exist_najie_thing(usr_qq, thing_name, "道具")
                if (isNotNull(number) && number > 3*quantity-1){
                await Add_najie_thing(usr_qq, "钻石碎屑", "道具", 1*quantity);
                await Add_najie_thing(usr_qq, thing_name, "道具", -3*quantity);
                e.reply(["合成成功，获得钻石碎屑"+quantity+"个"])
                return
                }
                else {
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }    
            if (thing_name == "钻石碎屑") {
                let number = await exist_najie_thing(usr_qq, thing_name, "道具")
                if (isNotNull(number) && number > 3*quantity-1){
                await Add_najie_thing(usr_qq, "钻石碎片", "道具", 1*quantity);
                await Add_najie_thing(usr_qq, thing_name, "道具", -3*quantity);
                e.reply(["合成成功，获得钻石碎片"+quantity+"个"])
                return
                }
                else {
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }    
            if (thing_name == "钻石碎片") {
                let number = await exist_najie_thing(usr_qq, thing_name, "道具")
                if (isNotNull(number) && number > 3*quantity-1){
                await Add_najie_thing(usr_qq, "钻石碎块", "道具", 1*quantity);
                await Add_najie_thing(usr_qq, thing_name, "道具", -3*quantity);
                e.reply(["合成成功，获得钻石碎块"+quantity+"个"])
                return
                }
                else {
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }    
            if (thing_name == "钻石碎块") {
                let number = await exist_najie_thing(usr_qq, thing_name, "道具")
                if (isNotNull(number) && number > 3*quantity-1){
                await Add_najie_thing(usr_qq, "钻石石块", "道具", 1*quantity);
                await Add_najie_thing(usr_qq, thing_name, "道具", -3*quantity);
                e.reply(["合成成功，获得钻石石块"+quantity+"个"])
                return
                }
                else {
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }        
            if (thing_name == "钻石石块") {
                let number = await exist_najie_thing(usr_qq, thing_name, "道具")
                if (isNotNull(number) && number > 3*quantity-1){
                await Add_najie_thing(usr_qq, "钻石锭", "材料", 1*quantity);
                await Add_najie_thing(usr_qq, thing_name, "道具", -3*quantity);
                e.reply(["合成成功，获得钻石锭"+quantity+"个"])
                return
                }
                else {
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }   
            if (thing_name == "钻石锭") {
                let number = await exist_najie_thing(usr_qq, thing_name, "道具")
                if (isNotNull(number) && number > 3*quantity-1){
                await Add_najie_thing(usr_qq, "仙子邀约", "道具", 1*quantity);
                await Add_najie_thing(usr_qq, thing_name, "道具", -3*quantity);
                e.reply(["合成成功，获得仙子邀约"+quantity+"个"])
                return
                }
                else {
                    e.reply("你没有足够的"+thing_name)
                    return
                }
            }         
            if (thing_name == "闹钟呼唤器") {
                e.reply([segment.at(1564856979), "闹钟！！有人找你"])
                await Add_najie_thing(usr_qq, "闹钟呼唤器", "道具", -1);
                return
            }
    if (thing_name == "雪铃零藏的新春木盒"){
                let daomu=Math.round(Math.random()*4)
                if(daomu>0){
                if(daomu<2){
                await Add_najie_thing(usr_qq, "玄土", "材料", 1000000);
                await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                e.reply(["你打开了雪铃零藏的新春木盒,里面有一袋红宝石"])
                return
                }
                if(daomu>1&&daomu<3){
                await Add_najie_thing(usr_qq, "秘境之匙", "道具", 2);
                await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                e.reply(["你打开了雪铃零藏的新春木盒，里面有一些钥匙"])
                return
                }
                if(daomu>2&&daomu<4){
                await Add_灵石(usr_qq, -1000000);
                await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                e.reply(["你打开了雪铃零藏的新春木盒，未曾想里面是八个蛋，去医院消耗了100w灵石"])
                return
                }
                if(daomu>3&&daomu<5){
                    await Add_灵石(usr_qq, 5000000);
                await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                e.reply(["你打开了雪铃零藏的新春木盒，里面有很多灵石， 你发达了"])
                return
                }
                }
                else{
                await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                e.reply("你打开了雪铃零藏的新春木盒，里面什么都没有")
                return
                }
            }
    if (thing_name == "闹钟藏的新春铁盒"){
                let daomu=Math.round(Math.random()*6)
                if(daomu>0){
                if(daomu<2){
                await Add_najie_thing(usr_qq, "庚金", "材料", 1000000);
                await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", -1);
                e.reply(["你打开了闹钟藏的新春铁盒,里面有一袋庚金"])
                return
                }
                if(daomu>1&&daomu<3){
                await Add_najie_thing(usr_qq, "新年快乐剑", "装备", 1);
                await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", -1);
                e.reply(["你打开了闹钟藏的新春铁盒，里面有一把武器，竟然是新年快乐剑"])
                return
                }
                if(daomu>2&&daomu<4){
                await Add_najie_thing(usr_qq, "新年快乐符", "装备", 1);
                await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", -1);
                e.reply(["你打开了闹钟藏的新春铁盒，里面有一个法宝，竟然是新年快乐符"])
                return
                }
                if(daomu>3&&daomu<5){
                await Add_najie_thing(usr_qq, "新年快乐甲", "装备", 1);
                await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", -1);
                e.reply(["你打开了闹钟藏的新春铁盒，里面有一个甲，竟然是新年快乐甲"])
                return
                }
                if(daomu>4&&daomu<6){
                    await Add_najie_thing(usr_qq, "秘境之匙", "道具", 2);
                    await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", -1);
                    e.reply(["你打开了闹钟藏的新春铁盒，里面有一些秘境之匙"])
                    return;
                }
                if(daomu==6){
                    await Add_灵石(usr_qq, -1000000);
                await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", -1);
                e.reply(["你打开了闹钟的新春铁盒，未曾想里面是八个蛋，去医院消耗了100w灵石"])
                return
                }
                }
                else{
                await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", -1);
                e.reply("你打开了闹钟藏的新春铁盒，里面什么都没有")
                return
                }
            }
            if (thing_name == "轮回阵旗") {
                player.lunhuiBH = 1;
                await data.setData("player", usr_qq, player);
                e.reply(["已得到\"轮回阵旗\"的辅助，下次轮回可抵御轮回之苦的十之八九"]);
                await Add_najie_thing(usr_qq, "轮回阵旗", "道具", -1);
                return;
            }
            if (thing_name == "仙梦之匙") {
                if (player.仙宠 == []) {
                    e.reply("你还没有出战仙宠");
                    return;
                }
                player.仙宠.灵魂绑定 = 0;
                await data.setData("player", usr_qq, player);
                await Add_najie_thing(usr_qq, "仙梦之匙", "道具", -1);
                e.reply("出战仙宠解绑成功!");
                return;
            }
            if (thing_name == "帝皇铠甲激活器") {
                let number = await exist_najie_thing(usr_qq, "帝皇铠甲【未激活】", "装备")
                if (isNotNull(number)) {
                    let last = await najie.装备.find(item => item.name == "帝皇铠甲【未激活】")
                    await Add_najie_thing(usr_qq, "帝皇铠甲【未激活】", "装备", -1, last.pinji);
                    await Add_najie_thing(usr_qq, "帝皇铠甲激活器", "道具", -1);
                    await Add_najie_thing(usr_qq, "帝皇铠甲", "装备", 1, last.pinji);
                    e.reply("成功激活")
                    return
                } else {
                    e.reply("你没有帝皇铠甲【未激活】")
                    return
                }
            }
            if (thing_name == "残卷") {
                let number = await exist_najie_thing(usr_qq, "残卷", "道具")
                if (isNotNull(number) && number > 9) {
                    /** 设置上下文 */
                    this.setContext('DUIHUAN');
                    /** 回复 */
                    await e.reply('是否消耗十个卷轴兑换一个八品功法？回复:【兑换*功法名】或者【还是算了】进行选择', false, { at: true });
                    return
                } else {
                    e.reply("你没有足够的残卷")
                    return
                }
            }
            if (thing_name == "神器石") {
                if ((player.魔道值 > 0 || (player.灵根.type != "转生" && player.level_id < 42))) {
                    e.reply("你尝试使用它,但是失败了")
                    return
                }
                let equipment = await Read_equipment(usr_qq);
                let equ = [];
                for (var i = 0; i < data.equipment_list.length; i++) {
                    if (data.equipment_list[i].name == equipment.武器.name) {
                        equ[0] = (data.equipment_list[i]);
                    } else if (data.equipment_list[i].name == equipment.法宝.name) {
                        equ[1] = (data.equipment_list[i]);
                    } else if (data.equipment_list[i].name == equipment.护具.name) {
                        equ[2] = (data.equipment_list[i]);
                    }
                }
                for (var i = 0; i < data.timeequipmen_list.length; i++) {
                    if (data.timeequipmen_list[i].name == equipment.武器.name) {
                        equ[0] = (data.timeequipmen_list[i]);
                    } else if (data.timeequipmen_list[i].name == equipment.法宝.name) {
                        equ[1] = (data.timeequipmen_list[i]);
                    } else if (data.timeequipmen_list[i].name == equipment.护具.name) {
                        equ[2] = (data.timeequipmen_list[i]);
                    }
                }
                let random = Math.random();
                if (random < 0.2) {
                    var randomd1 = Math.floor(Math.random() * 6)
                    if (isNotNull(equipment.武器.pinji)) {
                        equipment.武器.pinji = randomd1
                    }
                }
                else if (random < 0.6) {
                    var randomd2 = Math.floor(Math.random() * 6)
                    if (isNotNull(equipment.护具.pinji)) {
                        equipment.护具.pinji = randomd2
                    }
                }
                else {
                    var randomd3 = Math.floor(Math.random() * 6)
                    if (isNotNull(equipment.法宝.pinji)) {
                        equipment.法宝.pinji = randomd3
                    }
                }
                await Write_equipment(usr_qq, equipment)
                if (equ.length != 3) {
                    e.reply("error，装备不存在")
                    return;
                }
                let z
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.武器.pinji];
                equipment.武器.atk = Math.floor(equ[0].atk * z);
                equipment.武器.def = Math.floor(equ[0].def * z);
                equipment.武器.HP = Math.floor(equ[0].HP * z);
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.护具.pinji];
                equipment.护具.atk = Math.floor(equ[2].atk * z);
                equipment.护具.def = Math.floor(equ[2].def * z);
                equipment.护具.HP = Math.floor(equ[2].HP * z);
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.法宝.pinji];
                equipment.法宝.atk = Math.floor(equ[1].atk * z);
                equipment.法宝.def = Math.floor(equ[1].def * z);
                equipment.法宝.HP = Math.floor(equ[1].HP * z);
                await Write_equipment(usr_qq, equipment)
                await Add_najie_thing(usr_qq, "神器石", "道具", -1)
                e.reply("使用成功,发送#我的装备查看属性")
                return
            }
            if (thing_name == "魔器石") {
                if (player.魔道值 < 1000) {
                    e.reply("你还不是魔头,无法使用")
                    return
                }
                let equipment = await Read_equipment(usr_qq);
                let equ = [];
                for (var i = 0; i < data.equipment_list.length; i++) {
                    if (data.equipment_list[i].name == equipment.武器.name) {
                        equ[0] = (data.equipment_list[i]);
                    } else if (data.equipment_list[i].name == equipment.法宝.name) {
                        equ[1] = (data.equipment_list[i]);
                    } else if (data.equipment_list[i].name == equipment.护具.name) {
                        equ[2] = (data.equipment_list[i]);
                    }
                }
                for (var i = 0; i < data.timeequipmen_list.length; i++) {
                    if (data.timeequipmen_list[i].name == equipment.武器.name) {
                        equ[0] = (data.timeequipmen_list[i]);
                    } else if (data.timeequipmen_list[i].name == equipment.法宝.name) {
                        equ[1] = (data.timeequipmen_list[i]);
                    } else if (data.timeequipmen_list[i].name == equipment.护具.name) {
                        equ[2] = (data.timeequipmen_list[i]);
                    }
                }
                let random = Math.random();
                if (random < 0.2) {
                    var randomd1 = Math.floor(Math.random() * 6)
                    if (isNotNull(equipment.武器.pinji)) {
                        equipment.武器.pinji = randomd1
                    }
                }
                else if (random < 0.6) {
                    var randomd2 = Math.floor(Math.random() * 6)
                    if (isNotNull(equipment.护具.pinji)) {
                        equipment.护具.pinji = randomd2
                    }
                }
                else {
                    var randomd3 = Math.floor(Math.random() * 6)
                    if (isNotNull(equipment.法宝.pinji)) {
                        equipment.法宝.pinji = randomd3
                    }
                }
                await Write_equipment(usr_qq, equipment)
                if (equ.length != 3) {
                    e.reply("error，装备不存在")
                    return;
                }
                let z
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.武器.pinji];
                equipment.武器.atk = Math.floor(equ[0].atk * z);
                equipment.武器.def = Math.floor(equ[0].def * z);
                equipment.武器.HP = Math.floor(equ[0].HP * z);
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.护具.pinji];
                equipment.护具.atk = Math.floor(equ[2].atk * z);
                equipment.护具.def = Math.floor(equ[2].def * z);
                equipment.护具.HP = Math.floor(equ[2].HP * z);
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.法宝.pinji];
                equipment.法宝.atk = Math.floor(equ[1].atk * z);
                equipment.法宝.def = Math.floor(equ[1].def * z);
                equipment.法宝.HP = Math.floor(equ[1].HP * z);
                await Write_equipment(usr_qq, equipment)
                await Add_najie_thing(usr_qq, "魔器石", "道具", -1)
                e.reply("使用成功,发送#我的装备查看属性")
                return
            }
            if (thing_name == "重铸石") {
                let equipment = await Read_equipment(usr_qq);
                let equ = [];
                for (var i = 0; i < data.equipment_list.length; i++) {
                    if (data.equipment_list[i].name == equipment.武器.name) {
                        equ[0] = (data.equipment_list[i]);
                    } else if (data.equipment_list[i].name == equipment.法宝.name) {
                        equ[1] = (data.equipment_list[i]);
                    } else if (data.equipment_list[i].name == equipment.护具.name) {
                        equ[2] = (data.equipment_list[i]);
                    }
                }
                for (var i = 0; i < data.timeequipmen_list.length; i++) {
                    if (data.timeequipmen_list[i].name == equipment.武器.name) {
                        equ[0] = (data.timeequipmen_list[i]);
                    } else if (data.timeequipmen_list[i].name == equipment.法宝.name) {
                        equ[1] = (data.timeequipmen_list[i]);
                    } else if (data.timeequipmen_list[i].name == equipment.护具.name) {
                        equ[2] = (data.timeequipmen_list[i]);
                    }
                }
                // if(isNotNull(equipment.武器.pinji)&&isNotNull(equipment.护具.pinji)&&isNotNull(equipment.法宝.pinji)){
                //     e.reply("你的所有装备品质已定，不可更改")
                //     return
                // }
                let randomd1 = Math.floor(Math.random() * 6)
                if (isNotNull(equipment.武器.pinji)) {
                    equipment.武器.pinji = randomd1
                }
                let randomd2 = Math.floor(Math.random() * 6)
                if (isNotNull(equipment.护具.pinji)) {
                    equipment.护具.pinji = randomd2
                }
                let randomd3 = Math.floor(Math.random() * 6)
                if (isNotNull(equipment.法宝.pinji)) {
                    equipment.法宝.pinji = randomd3
                }
                await Write_equipment(usr_qq, equipment)
                if (equ.length != 3) {
                    e.reply("error，装备不存在")
                    return;
                }
                let z
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.武器.pinji];
                equipment.武器.atk = Math.floor(equ[0].atk * z);
                equipment.武器.def = Math.floor(equ[0].def * z);
                equipment.武器.HP = Math.floor(equ[0].HP * z);
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.护具.pinji];
                equipment.护具.atk = Math.floor(equ[2].atk * z);
                equipment.护具.def = Math.floor(equ[2].def * z);
                equipment.护具.HP = Math.floor(equ[2].HP * z);
                z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][equipment.法宝.pinji];
                equipment.法宝.atk = Math.floor(equ[1].atk * z);
                equipment.法宝.def = Math.floor(equ[1].def * z);
                equipment.法宝.HP = Math.floor(equ[1].HP * z);
                await Write_equipment(usr_qq, equipment)
                await Add_najie_thing(usr_qq, "重铸石", "道具", -1)
                e.reply("使用成功,发送#我的装备查看属性")
                return
            }
            if (data.daoju_list.find(item => item.name == thing_name).type == "洗髓") {
                if (await player.linggenshow != 0) {
                    await e.reply("你未开灵根，无法洗髓！");
                    return;
                }
                //这里要判断境界，
                let now_level_id;
                if (!isNotNull(player.level_id)) {
                    await e.reply("请先#刷新信息");
                    return;
                }
                // now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
                // if(now_level_id>41){
                //     await e.reply("你灵根已定，不可再洗髓灵根！");
                //     return;
                // }
                if (player.lunhui != 0) {
                    let lhxg = await redis.get("xiuxian:player:" + usr_qq + ":Player_use");
                    if (lhxg != 1) {
                        e.reply("使用【洗根水】【补天丹】【补根丹】进行洗髓将清除轮回状态！\n回复:【确认洗根】或者【取消】进行选择");
                        this.setContext('yesxigen');
                        return;
                    } else if (lhxg == 1) {
                        await redis.set("xiuxian:player:" + usr_qq + ":Player_use", 0);
                    }
                    let gongfa = ["一转轮回", "二转轮回", "三转轮回", "四转轮回", "五转轮回", "六转轮回", "七转轮回", "八转轮回", "九转轮回"];
                    for (let i = 0; i < player.lunhui; i++) {
                        let x = await exist_najie_thing(usr_qq, gongfa[i], "功法");
                        if (!x) {
                            await Reduse_player_学习功法(usr_qq, gongfa[i]);
                        }
                        await Add_najie_thing(usr_qq, gongfa[i], "功法", -1);
                    }
                    player.lunhui = 0;
                }
                await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                player.灵根 = await get_random_talent();
                data.setData("player", usr_qq, player);
                await player_efficiency(usr_qq);
                e.reply([segment.at(usr_qq), `  服用成功,剩余 ${thing_name}数量: ${x - 1}，新的灵根为 "${player.灵根.type}"：${player.灵根.name}`, "\n可以在【#我的练气】中查看"]);
                return;
            } else if (thing_name == "隐身水") {
                e.reply(`该道具无法在纳戒中消耗,在打劫非空闲群友时自动消耗`);
                return;
            } else if (thing_name == "幸运草") {
                e.reply(`该道具无法在纳戒中消耗,在幸运突破/幸运破体时自动消耗`);
                return;
            } else if (thing_name == "定灵珠") {
                await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                player.linggenshow = 0;
                await Write_player(usr_qq, player);
                e.reply(`你眼前一亮，看到了自己的灵根,` + `"${player.灵根.type}"：${player.灵根.name}`);
                return;
            } else if (thing_name == "攻击强化") {
                if (player.攻击加成 < 9000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.攻击加成 += 100000;
                    player.攻击 += 100000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的武器攻击变强了，攻击+100000`);
                    return;
                }
            } else if (thing_name == "防御强化") {
                if (player.防御加成 < 9000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.防御加成 += 100000;
                    player.防御 += 100000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的护具变强了，防御+100000`);
                    return;
                }
            } else if (thing_name == "生命强化") {
                if (player.生命加成 < 90000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.生命加成 += 1000000;
                    player.血量上限 += 1000000;
                    player.当前血量 += 1000000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的法宝变强了，生命+1000000`);
                    return;
                }
            } else if (thing_name == "武魂石") {
                if (player.魔道值 < 1000) {
                    e.reply(`你还是提升点魔道值再用吧!`);
                    return;
                }
                if (player.攻击加成 < 9000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.攻击加成 += 10000;
                    player.攻击 += 10000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的攻击力提高了`);
                    return;
                }
            }
            else if (thing_name == "法魂石") {
                if (player.魔道值 < 1000) {
                    e.reply(`你还是提升点魔道值再用吧!`);
                    return;
                }
                if (player.生命加成 < 90000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.生命加成 += 100000;
                    player.血量上限 += 100000;
                    player.当前血量 += 100000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的生命值提高了`);
                    return;
                }
            }
            else if (thing_name == "甲魂石") {
                if (player.魔道值 < 1000) {
                    e.reply(`你还是提升点魔道值再用吧!`);
                    return;
                }
                if (player.防御加成 < 9000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.防御加成 += 10000;
                    player.防御 += 10000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的防御力提高了`);
                    return;
                }
            }
            else if (thing_name == "武神石") {
                if (player.魔道值 > 0 || (player.灵根.type != "转生" && player.level_id < 42)) {
                    e.reply(`你尝试使用它,但是失败了`);
                    return;
                }
                if (player.攻击加成 < 9000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.攻击加成 += 10000;
                    player.攻击 += 10000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的攻击力提高了`);
                    return;
                }
            }
            else if (thing_name == "法神石") {
                if (player.魔道值 > 0 || (player.灵根.type != "转生" && player.level_id < 42)) {
                    e.reply(`你尝试使用它,但是失败了`);
                    return;
                }
                if (player.生命加成 < 90000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.生命加成 += 100000;
                    player.血量上限 += 100000;
                    player.当前血量 += 100000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的生命值提高了`);
                    return;
                }
            }
            else if (thing_name == "甲神石") {
                if (player.魔道值 > 0 || (player.灵根.type != "转生" && player.level_id < 42)) {
                    e.reply(`你尝试使用它,但是失败了`);
                    return;
                }
                if (player.防御加成 < 9000000) {
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    player.防御加成 += 10000;
                    player.防御 += 10000;
                    await Write_player(usr_qq, player);
                    e.reply(`你的防御力提高了`);
                    return;
                }
            }
            else {
                e.reply(`功能开发中,敬请期待`);
                return;
            }
        }
        if (func == "学习") {
            let x = await exist_najie_thing(usr_qq, thing_name, "功法");
            if (!x) {
                e.reply(`你没有【${thing_name}】这样的功法`);
                return;
            }
            let player = await Read_player(usr_qq);
            let islearned = player.学习的功法.find(item => item == thing_name);
            if (islearned) {
                e.reply(`你已经学过该功法了`);
                return;
            }
            await Add_najie_thing(usr_qq, thing_name, "功法", -1);
            //
            await Add_player_学习功法(usr_qq, thing_name);
            e.reply(`你学会了${thing_name},可以在【#我的炼体】中查看`);
        }
        if (func == "打开") {
            let x = await exist_najie_thing(usr_qq, thing_name, "盒子");
            if (!x) {
                e.reply(`你没有【${thing_name}】这样的盒子`);
                return;
            }
            let thing = data.hezi_list.find(item => item.name == thing_name);
            await Add_najie_thing(usr_qq, thing_name, "盒子", -1);
            let contents = thing.contents;
            let rand = Math.random();
            let rate = 0;
            for (let i in contents) {
                rate += contents[i].rate;
                if (rand < rate) {
                    let item = contents[i].items[Math.floor(Math.random() * contents[i].items.length)];
                    await Add_najie_thing(usr_qq, item.name, item.class, item.amount);
                    e.reply(`${player.名号}打开${thing_name}，获得了${item.name}×${item.amount}`);
                    break;
                }
            }
            return;
        }
        if (func == "解除封印") {
            let fyin_list = ["诛仙剑【封】", "戮仙剑【封】", "陷仙剑【封】", "绝仙剑【封】", "天丛云剑【封】", "八尺琼勾玉【封】", "八咫镜【封】"]
            let NOTfyin_list = ["诛仙剑", "戮仙剑", "陷仙剑", "绝仙剑", "天丛云剑", "八尺琼勾玉", "八咫镜"]
            let x = await exist_najie_thing(usr_qq, thing_name, "装备");
            if (!x) {
                e.reply(`你没有【${thing_name}】`);
                return;
            }
            let o = 999
            for (var i = 0; fyin_list.length > i; i++) {
                if (fyin_list[i] == thing_name) {
                    o = i
                    console.log("找到了")
                    break
                }
            }
            if (o == 999) {
                e.reply("该物品不存在封印")
                return
            }
            let number = await exist_najie_thing(usr_qq, "【天道束链-逆】", "道具")
            if (isNotNull(number)) {
                await Add_najie_thing(usr_qq, "【天道束链-逆】", "道具", -1)
                let random = Math.random()//50%
                if (random < 0.5) {
                    let pinji = ['劣', '普', '优', '精', '极', '绝', '顶']
                    let lastpinji = await najie.装备.find(item => item.name == fyin_list[o]).pinji
                    await Add_najie_thing(usr_qq, fyin_list[o], "装备", -1, lastpinji)
                    await Add_najie_thing(usr_qq, NOTfyin_list[o], "装备", 1, lastpinji)
                    e.reply("解封[" + fyin_list[o] + "]成功,获得[" + NOTfyin_list[o] + "【" + pinji[lastpinji] + "】" + "]")
                    return
                } else {
                    e.reply("封印之力过于强大,解封失败")
                    return
                }
            } else {
                e.reply("你没有[【天道束链-逆】],无法解封")
                return
            }
        }
        if (func == "寻宝") {
            await Go(e);
        if (allaction) {
            console.log(allaction);
        } else {
            return;
        }
        allaction = false;
            let x = await exist_najie_thing(usr_qq, thing_name, "道具");
            if (!x) {
                e.reply(`你没有【${thing_name}】这样的道具`);
                return;
            }
            if (thing_name == "木铲") {
                let daomu = Math.round(Math.random() * 5)
                if (daomu > 0) {
                    if (daomu < 2) {
                        await Add_najie_thing(usr_qq, "庚金", "材料", 300000);
                        await Add_najie_thing(usr_qq, "木铲", "道具", -1); 
                        e.reply(["你随便找了个位置就开启寻宝，未曾想挖到了一袋不知道是谁扔在这里的庚金"])
                        return
                    }
                    if (daomu > 1 && daomu < 3) {
                        await Add_najie_thing(usr_qq, "钻石尘埃", "道具", 1);
                        await Add_najie_thing(usr_qq, "木铲", "道具", -1);
                        e.reply(["你寻宝了半天都没有找到任何东西，恼怒的你随手薅了一把杂草就回家了，没想到里面参杂了一些尘埃"])
                        return
                    }
                    if (daomu > 2 && daomu < 4) {
                        await Add_灵石(usr_qq, -500000);
                        e.reply(["你兴致勃勃的就去寻宝了，未曾想遇到了一路劫匪，在交了500000灵石的过路费后失望而归"])
                        return
                    }
                    if (daomu > 3 && daomu < 5) {
                        await Add_najie_thing(usr_qq, "猫猫藏的新春礼盒", "道具", 1);
                        await Add_najie_thing(usr_qq, "木铲", "道具", -1);
                        e.reply(["你在寻宝的时候意外发现了一个猫猫藏的新春礼盒"])
                        return
                    }
                    if (daomu > 4&& daomu < 6) {
                        await Add_najie_thing(usr_qq, "秘境之匙", "道具", 1);
                        await Add_najie_thing(usr_qq, "木铲", "道具", -1);
                        e.reply(["你在寻宝的时候意外发现了一把钥匙,你觉得以后可能会有用处,于是带回家了"])
                        return
                    }
                } else {
                    await Add_najie_thing(usr_qq, "木铲", "道具", -1);
                    e.reply("你寻宝了半天，都没有发现任何东西，失望的你只好回家去了")
                    return
                }
            
        }
            if (thing_name == "石铲") {
                  let si = parseInt(player.血量上限 * 1); 
                let daomu = Math.round(Math.random() * 4)
                if (daomu > 0) {
                    if (daomu < 2) {
                        await Add_najie_thing(usr_qq, "猫猫藏的新春礼盒", "道具", 1);
                        await Add_灵石(usr_qq, 10000);
                        await Add_najie_thing(usr_qq, "石铲", "道具", -1);
                        e.reply(["你找到了一个地方开始寻宝，找到了一个猫猫藏的新春礼盒和一些饰品，在回家的路上路过了一个回收饰品的商铺，卖了10000灵石。"])
                        return
                    }
                    if (daomu > 1 && daomu < 3) {
                        await Add_najie_thing(usr_qq, "秘境之匙", "道具", 1);
                        await Add_najie_thing(usr_qq, "石铲", "道具", -1);
                        e.reply(["你找了一个看起来是很好的寻宝地点开始寻宝，结果找到了一把金色的钥匙"])
                        return
                    }
                    if (daomu > 2 && daomu < 4) {
                     
                        await Add_修为(usr_qq, 800);
                        await Add_HP(usr_qq, si);
                        await Add_najie_thing(usr_qq, "石铲", "道具", -1);
                        e.reply(["你随便找了个地方就寻宝，未曾想找到了一群僵尸，你只击败了一部分就落荒而逃,只获得了800修为"])
                        return
                    }
                    if (daomu > 3 && daomu < 5) {
                        await Add_najie_thing(usr_qq, "钻石微粒", "道具", 1);
                        await Add_najie_thing(usr_qq, "石铲", "道具", -1);
                        e.reply(["你找到了一个地方开始寻宝,没想到找到了一些钻石微粒"])
                        return
                    }
                } else {
                    await Add_najie_thing(usr_qq, "石铲", "道具", -1);
                    e.reply("你挖了半天，都没有发现任何东西，失望的你只好回家去了")
                    return
                }
            }
            if (thing_name == "铁铲") {
                let daomu = Math.round(Math.random() * 4)
                if (daomu > 0) {
                    if (daomu < 2) {
                        await Add_najie_thing(usr_qq, "猫猫藏的新春礼盒", "道具", 1);
                        await Add_najie_thing(usr_qq, "铁铲", "道具", -1);
                        e.reply(["你找到了一个好地方开始寻宝,找到了一个猫猫藏的新春礼盒"])
                        return
                    }
                    if (daomu > 1 && daomu < 3) {
                        await Add_najie_thing(usr_qq, "洛阳铲", "道具", 1);
                        await Add_najie_thing(usr_qq, "铁铲", "道具", -1);
                        e.reply(["你认真的开始寻宝，结果却什么也没找到，在回家的路上捡到一把洛阳铲"])
                        return
                    }
                    if (daomu > 2 && daomu < 4) {
                        await Add_修为(usr_qq, 2000000);
                        await Add_najie_thing(usr_qq, "铁铲", "道具", -1);
                        e.reply(["你在寻宝的时候突然领悟了一个招式，你称它为此刻寂灭之时，修为增加了2000000"])
                        return
                    }
                    if (daomu > 3 && daomu < 5) {
                        await Add_灵石(usr_qq, 500000);
                        await Add_HP(usr_qq, -5000000);
                        e.reply(["你在前往寻宝的途中忽然脚下一滑，摔了一跤，意外捡到了500000灵石，可是将脚扭了血量降低5000000"])
                        return
                    }
                } else {
                    await Add_najie_thing(usr_qq, "铁铲", "道具", -1);
                    e.reply("你寻宝了半天，都没有发现任何东西，失望的你只好回家去了")
                    return
                }
            }
            if (thing_name == "洛阳铲") {
                let si = parseInt(player.血量上限 * 1);
                let jianshao = parseInt(player.血量上限 * 0.25);
                let daomu = Math.round(Math.random() * 4)
                if (daomu > 0) {
                    if (daomu < 2) {
                        await Add_najie_thing(usr_qq, "猫猫藏的新春礼盒", "道具", 1);
                        await Add_najie_thing(usr_qq, "洛阳铲", "道具", -1);
                        e.reply(["你找到了一个地方开始寻宝，找到了1个盒子"])
                        return
                    }
                    if (daomu > 1 && daomu < 3) {
                        await Add_najie_thing(usr_qq, "秘境之匙", "道具", 1);
                        await Add_najie_thing(usr_qq, "洛阳铲", "道具", -1);
                        e.reply(["你在寻宝的时候意外的找到了秘境之匙，你吓了一跳，但是考虑到它的价值，还是老老实实的将它放入了纳戒"])
                        return
                    }
                    if (daomu > 2 && daomu < 4) {
                        await Add_najie_thing(usr_qq, "钻石碎片", "道具", 1);
                        await Add_najie_thing(usr_qq, "洛阳铲", "道具", -1);
                        e.reply(["你在挖掘的时候意外的找到了钻石碎片，你吓了一跳，但是考虑到它的价格，还是老老实实的将它放入了纳戒"])
                        return
                    }
                    if (daomu > 3 && daomu < 5) {
                        await Add_修为(usr_qq, 500000);
                        await Add_血气(usr_qq, 500000);
                        await Add_灵石(usr_qq, 1000000);
                        await Add_HP(usr_qq, -jianshao);
                        await Add_najie_thing(usr_qq, "洛阳铲", "道具", -1);
                        e.reply(["你在寻宝的时候意外发现了一个人在挑衅你，你当即就不能忍，经过一番战斗最终战胜了他，你在他身上找了1000000灵石，修为增加了500000，血气增加了500000，血量降低了" + jianshao])
                        return
                    }
                } else {
                    await Add_灵石(usr_qq, -5000000);
                    await Add_HP(usr_qq, -si);
                    await Add_najie_thing(usr_qq, "洛阳铲", "道具", -1);
                    e.reply("你在挖掘的时候意外发现了一个人在挑衅你，你当即就不能忍，结果战败了，血量降低" + si + ",灵石被他劫走了5000000")
                    return
                }
            }
            if (thing_name == "玩具铲") {
                let daomu = Math.round(Math.random() * 2)
                if (daomu > 0) {
                    if (daomu < 2) {
                        await Add_najie_thing(usr_qq, "幸运草", "道具", 1);
                        await Add_najie_thing(usr_qq, "玩具铲", "道具", -1);
                        e.reply(["你拿着玩具铲不知所措，没想到正好看到一株幸运草，你使用玩具铲将它挖了下来"])
                        return
                    }
                    if (daomu > 1 && daomu < 3) {
                        await Add_najie_thing(usr_qq, "钻石尘埃", "道具", 9);
                        await Add_najie_thing(usr_qq, "玩具铲", "道具", -1);
                        e.reply(["你因为熊孩子的恶作剧而生气的四处张望，看到了一个小孩子正在朝你做鬼脸，你追了上去却追丢了，最终只获得了一挫钻石尘埃"])
                        return
                    }
                   
                } else {        
                    await Add_najie_thing(usr_qq, "玩具铲", "道具", -1);
                    e.reply("你拿着玩具铲去寻宝，结果什么都没有找到");
                }
            }
            
            if (thing_name == "钻石铲") {
                  let si = parseInt(player.血量上限 * 1); 
                let jianshao = parseInt(player.血量上限 * 0.25);
                let daomu = Math.round(Math.random() * 4)
                if (daomu > 0) {
                    if (daomu < 2) {
                        await Add_najie_thing(usr_qq, "猫猫藏的新春礼盒", "道具", 2);
                        await Add_najie_thing(usr_qq, "钻石铲", "道具", -1);
                        e.reply(["你找到了一个地方开始寻宝，找到到了好几个盒子"])
                        return
                    }
                    if (daomu > 1 && daomu < 3) {
                        let huoba = await exist_najie_thing(usr_qq, "火把", "道具");
                       
                        if (!huoba) {                     
                            await Add_najie_thing(usr_qq, "幸运草", "道具", 1);  
                            await Add_najie_thing(usr_qq, "钻石铲", "道具", -1);
                            e.reply(`你朝着深处寻宝，在很深的地方看到了一个宝地，因为没有火把你不敢朝着深处探索你只好无功而返了，在返回的时候看到了一株幸运草你用钻石铲将它取下来放入了纳戒`);
                            return;
                        } else {
                           
                            await Add_najie_thing(usr_qq, "火把", "道具", -1);     
                            await Add_najie_thing(usr_qq, "钻石锭", "道具", 1);
                            await Add_修为(usr_qq, 5000000);
                            await Add_血气(usr_qq, 5000000);   
                            e.reply(["你朝着深处寻宝，在很深的地方找到了一个宝地，你拿出了纳戒中的火把进行探索最终在宝地深处发现了一个钻石锭，你欣喜的将他们放进纳戒，在探索过程中遇到了一些怪物，你击败了他们，修为增加了5000000，血气增加了5000000"])
                            return
                        }
                    }
                    if (daomu > 2 && daomu < 4) {
                        await Add_najie_thing(usr_qq, "钻石碎片", "道具", 1);
                        e.reply(["你在挖掘的时候意外的挖到了钻石碎片，你吓了一跳，但是考虑到它的价格，还是老老实实的将它放入了纳戒"])
                        return
                    }
                    if (daomu > 3 && daomu < 5) {     
                        await Add_najie_thing(usr_qq, "秘境之匙", "道具", 2);                                      
                        await Add_血气(usr_qq, 500000);
                        await Add_HP(usr_qq, -jianshao);
                        e.reply(["你在寻宝的过程中发现了一些钥匙,遇见了在地底修炼的妖兽，你击败了他们，血气增加了500000,血量降低了"+jianshao])
                        return
                    }
                } else {
                    
                    await Add_灵石(usr_qq, -5000000);
                    await Add_HP(usr_qq, si);
                    cishu = cishu - 1;
                    e.reply("你在挖掘的时候意外发现了一个人在挑衅你，你当即就不能忍，结果战败了，血量降低" + si + "灵石被他劫走了5000000")
                    return
                }
            }
        } 
        if(func=="合成"){
        if (thing_name == "钻石微粒") {
            let number = await exist_najie_thing(usr_qq, "钻石尘埃", "道具")
            if (isNotNull(number) && number > 3*quantity-1){
            await Add_najie_thing(usr_qq, "钻石微粒", "道具", 1*quantity);
            await Add_najie_thing(usr_qq, "钻石尘埃", "道具", -3*quantity);
            e.reply(["合成成功，获得钻石微粒"+quantity+"个"])
            return
            }
            else {
                e.reply("你没有足够的钻石尘埃")
                return
            }
        }    
        if (thing_name == "钻石碎屑") {
            let number = await exist_najie_thing(usr_qq, "钻石微粒", "道具")
            if (isNotNull(number) && number > 3*quantity-1){
            await Add_najie_thing(usr_qq, "钻石碎屑", "道具", 1*quantity);
            await Add_najie_thing(usr_qq, "钻石微粒", "道具", -3*quantity);
            e.reply(["合成成功，获得钻石碎屑"+quantity+"个"])
            return
            }
            else {
                e.reply("你没有足够的"+"钻石微粒")
                return
            }
        }    
        if (thing_name == "钻石碎片") {
            let number = await exist_najie_thing(usr_qq, "钻石碎屑", "道具")
            if (isNotNull(number) && number > 3*quantity-1){
            await Add_najie_thing(usr_qq, "钻石碎片", "道具", 1*quantity);
            await Add_najie_thing(usr_qq, "钻石碎屑", "道具", -3*quantity);
            e.reply(["合成成功，获得钻石碎片"+quantity+"个"])
            return
            }
            else {
                e.reply("你没有足够的"+"钻石碎屑")
                return
            }
        }    
        if (thing_name == "钻石碎块") {
            let number = await exist_najie_thing(usr_qq, "钻石碎片", "道具")
            if (isNotNull(number) && number > 3*quantity-1){
            await Add_najie_thing(usr_qq, "钻石碎块", "道具", 1*quantity);
            await Add_najie_thing(usr_qq,"钻石碎片" , "道具", -3*quantity);
            e.reply(["合成成功，获得钻石碎块"+quantity+"个"])
            return
            }
            else {
                e.reply("你没有足够的"+"钻石碎片")
                return
            }
        }    
        if (thing_name == "钻石石块") {
            let number = await exist_najie_thing(usr_qq, "钻石碎块", "道具")
            if (isNotNull(number) && number > 3*quantity-1){
            await Add_najie_thing(usr_qq, "钻石石块", "道具", 1*quantity);
            await Add_najie_thing(usr_qq, "钻石碎块", "道具", -3*quantity);
            e.reply(["合成成功，获得钻石石块"+quantity+"个"])
            return
            }
            else {
                e.reply("你没有足够的"+"钻石碎块")
                return
            }
        }        
        if (thing_name == "钻石锭") {
            let number = await exist_najie_thing(usr_qq, "钻石石块" , "道具")
            if (isNotNull(number) && number > 3*quantity-1){
            await Add_najie_thing(usr_qq, "钻石锭", "材料", 1*quantity);
            await Add_najie_thing(usr_qq,  "钻石石块", "道具", -3*quantity);
            e.reply(["合成成功，获得钻石锭"+quantity+"个"])
            return
            }
            else {
                e.reply("你没有足够的"+ "钻石石块")
                return
            }
        }   
        if (thing_name == "仙子邀约") {
            let number = await exist_najie_thing(usr_qq, "钻石锭", "道具")
            if (isNotNull(number) && number > 5*quantity-1){
            await Add_najie_thing(usr_qq, "仙子邀约", "道具", 1*quantity);
            await Add_najie_thing(usr_qq, "钻石锭", "道具", -5*quantity);
            e.reply(["合成成功，获得仙子邀约"+quantity+"个"])
            return
            }
            else {
                e.reply("你没有足够的"+"钻石锭")
                return
            }
        }
    }          
        return;
    }

    async yesxigen(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        /** 内容 */
        let usr_qq = e.user_id;
        let new_msg = this.e.message;
        let choice = new_msg[0].text;
        let now = new Date();
        if (choice == "取消") {
            await this.reply('已取消洗髓');
            this.finish('yesxigen');
            return;
        } else if (choice == "确认洗根") {
            await redis.set("xiuxian:player:" + usr_qq + ":Player_use", 1);
            e.reply("请再次输入#消耗洗根水！");
            //console.log(this.getContext().recall);
            this.finish('yesxigen');
            return;
        } else if (choice == "确认补天") {
            await redis.set("xiuxian:player:" + usr_qq + ":Player_use", 2);
            e.reply("请再次输入#服用补天丹！");
            //console.log(this.getContext().recall);
            this.finish('yesxigen');
            return;
        } else if (choice == "确认补根") {
            await redis.set("xiuxian:player:" + usr_qq + ":Player_use", 3);
            e.reply("请再次输入#服用补根丹！");
            //console.log(this.getContext().recall);
            this.finish('yesxigen');
            return;
        } else {
            this.setContext('yesxigen');
            await this.reply("使用【洗根水】【补天丹】【补根丹】进行洗髓将清除轮回状态！\n请正确回复进行选择");
            return;
        }
        /** 结束上下文 */
    }

    //兑换方法
    async DUIHUAN(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        /** 内容 */
        let new_msg = this.e.message;
        let choice = new_msg[0].text;
        let code = choice.split("\*");
        let les = code[0];//条件
        let gonfa = code[1];//功法
        if (les == "还是算了") {
            await this.reply('取消兑换');
            /** 结束上下文 */
            this.finish('DUIHUAN');
            return;
        } else if (les == "兑换") {
            let ifexist2 = data.bapin.find(item => item.name == gonfa);
            if (ifexist2) {
                await Add_najie_thing(usr_qq, "残卷", "道具", -10)
                await Add_najie_thing(usr_qq, gonfa, "功法", 1)
                await this.reply('兑换' + gonfa + "成功");
                this.finish('DUIHUAN');
                return;
            } else {
                await this.reply('残卷无法兑换该功法');
                this.finish('DUIHUAN');
                return;
            }
        }
    }

    //购买商品
    async Buy_comodities(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        await Go(e);
        if (allaction) {
            console.log(allaction);
        } else {
            return;
        }
        allaction = false;
        let thing = e.msg.replace("#", '');
        thing = thing.replace("购买", '');
        let code = thing.split("\*");
        let thing_name = code[0];
        //默认没有数量
        let quantity = 0;
        if (parseInt(code[1]) != parseInt(code[1])) {
            quantity = 1;
        } else if (parseInt(code[1]) < 1) {
            e.reply(`输入物品数量小于1,现在默认为1`);
            quantity = 1;
        }
        // else if (parseInt(code[1]) > 99) {
        //     e.reply(`客官，一次只能卖99瓶哦，货物稀缺呢~`);
        //     quantity = 99;
        // }
        else {
            quantity = parseInt(code[1]);
        }
        //e.reply(`thing_name:${thing_name},   quantity:${quantity}`);
        let ifexist = data.commodities_list.find(item => item.name == thing_name);
        if (!ifexist) {
            e.reply(`柠檬堂还没有这样的东西:${thing_name}`);
            return;
        }
        let player = await Read_player(usr_qq);
        let lingshi = player.灵石;
        //如果没钱，或者为负数
        if (lingshi <= 0) {
            e.reply(`掌柜：就你这穷酸样，也想来柠檬堂？走走走！`);
            return;
        }
        // 价格倍率
        //价格
        let commodities_price = ifexist.出售价 * 1.2 * quantity;
        let addWorldmoney = ifexist.出售价 * 0.2 * quantity;
        commodities_price =Math.trunc(commodities_price);
        //判断金额
        if (lingshi < commodities_price) {
            e.reply(`口袋里的灵石不足以支付${thing_name},还需要${commodities_price - lingshi}灵石`);
            return;
        }
        let Worldmoney = await redis.get("Xiuxian:Worldmoney");
        if (Worldmoney == null || Worldmoney == undefined || Worldmoney <= 0 || Worldmoney == NaN) {
            Worldmoney = 1;
        }
        Worldmoney = Number(Worldmoney);
        Worldmoney = Worldmoney + addWorldmoney;
        Worldmoney = Number(Worldmoney);
        await redis.set("Xiuxian:Worldmoney", Worldmoney);
        //符合就往戒指加
        await Add_najie_thing(usr_qq, thing_name, ifexist.class, quantity);
        await Add_灵石(usr_qq, -commodities_price);
        //发送消息
        e.reply([`购买成功!  获得[${thing_name}]*${quantity},花[${commodities_price}]灵石,剩余[${lingshi - commodities_price}]灵石  `, '\n可以在【我的纳戒】中查看']);
        return;
    }

    //出售商品
    async Sell_comodities(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //命令判断
        let thing = e.msg.replace("#", '');
        thing = thing.replace("出售", '');
        let code = thing.split("\*");
        //数量判断
        let pinji = null;
        let thing_name = null;
        let quantity = 0;
        if (code.length == 2) {
            thing_name = code[0];
            quantity = code[1].replace(/[^0-9]/ig, "");
        }
        else if (code.length == 3) {
            thing_name = code[0];
            pinji = code[1];
            quantity = code[2].replace(/[^0-9]/ig, "");
        }
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`万宝楼不回收这样的东西:${thing_name}`);
            return;
        }
        if (quantity==NaN) {
            e.reply("看你输的数是啥玩意！");
            return;
        }
        let pj = {
            "劣": 0,
            "普": 1,
            "优": 2,
            "精": 3,
            "极": 4,
            "绝": 5,
            "顶": 6
        }
        if (pinji != null) {
            pj = pj[pinji];
        }
        //纳戒中的数量
        let thing_quantity = await exist_najie_thing(usr_qq, thing_name, thing_exist.class, pj);
        if (!thing_quantity) {//没有
            e.reply(`你没有【${thing_name}】这样的${thing_exist.class}`);
            return;
        }
        if (thing_quantity < quantity) {//不够
            e.reply(`你目前只有【${thing_name}】*${thing_quantity},数量不够`);
            return;
        }
        //锁定禁止出售
        if (await Locked_najie_thing(usr_qq, thing_name, thing_exist.class, pj) == 1) {
            e.reply(`${thing_exist.class}:${thing_name}已锁定，请解锁后再出售。`);
            return;
        }
        if (thing_exist.id >= 400991 && thing_exist.id <= 400999) {
            e.reply(`轮回功法${thing_name}禁止出售。`)
            return;
        }
        //数量够,数量减少,灵石增加
        await Add_najie_thing(usr_qq, thing_name, thing_exist.class, -quantity, pj);
        let commodities_price = thing_exist.出售价 * quantity;
        await Add_灵石(usr_qq, commodities_price);
        e.reply(`出售成功!  获得${commodities_price}灵石,还剩余${thing_name}*${thing_quantity - quantity} `);
        return;
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
