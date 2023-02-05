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
    Add_热量,
    Add_饱食度,
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
    foundthing,
    convert2integer
} from '../Xiuxian/xiuxian.js'
import { __PATH} from "../Xiuxian/xiuxian.js"
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
                reg: '^#(装备|消耗|服用|学习|打开|解除封印|寻宝|合成|加工)((.*)|(.*)*(.*))$',
                fnc: 'Player_use'
            }, {
                reg: '^#购买((.*)|(.*)*(.*))$',
                fnc: 'Buy_comodities'
            }, {
                reg: '^#出售.*$',
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
            let tianluoRandom = Math.floor(Math.random() * data.changzhuxianchon.length);
            tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
            console.log(tianluoRandom);
            e.reply("一道金光从天而降")
            await sleep(5000)
            e.reply("金光掉落在地上，走近一看是【" + data.changzhuxianchon[tianluoRandom].品级 + "】" + data.changzhuxianchon[tianluoRandom].name)
            await sleep(1000)
            await Add_仙宠(usr_qq, data.changzhuxianchon[tianluoRandom].name, 1)
            e.reply("恭喜获得" + data.changzhuxianchon[tianluoRandom].name)
        }
        if (thing == "灵界卡池") {
            let x = await exist_najie_thing(usr_qq, "金丝仙网", "道具")
            if (!x) {
                e.reply("你没有【金丝仙网】")
                return
            }
            await Add_najie_thing(usr_qq, "金丝仙网", "道具", -1)
            let tianluoRandom = Math.floor(Math.random() * (data.changzhuxianchon.length));
            tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
            console.log(tianluoRandom);
            e.reply("一道金光从天而降")
            await sleep(5000)
            e.reply("金光掉落在地上，走近一看是【" + data.changzhuxianchon[tianluoRandom].品级 + "】" + data.changzhuxianchon[tianluoRandom].name)
            await sleep(1000)
            await Add_仙宠(usr_qq, data.changzhuxianchon[tianluoRandom].name, 1)
            e.reply("恭喜获得" + data.changzhuxianchon[tianluoRandom].name)
        }
        if (thing == "凡界卡池") {
            let x = await exist_najie_thing(usr_qq, "银丝仙网", "道具")
            if (!x) {
                e.reply("你没有【银丝仙网】")
                return
            }
            await Add_najie_thing(usr_qq, "银丝仙网", "道具", -1)
            let tianluoRandom = Math.floor(Math.random() * (data.changzhuxianchon.length - 10));
            tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
            console.log(tianluoRandom);
            e.reply("一道金光从天而降")
            await sleep(5000)
            e.reply("金光掉落在地上，走近一看是【" + data.changzhuxianchon[tianluoRandom].品级 + "】" + data.changzhuxianchon[tianluoRandom].name)
            await sleep(1000)
            await Add_仙宠(usr_qq, data.changzhuxianchon[tianluoRandom].name, 1)
            e.reply("恭喜获得" + data.changzhuxianchon[tianluoRandom].name)
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
        var reg = new RegExp(/装备|服用|消耗|学习|打开|解除封印|寻宝|合成|加工/);
        let func = reg.exec(e.msg);
        let msg = e.msg.replace(reg, '');
        msg = msg.replace("#", '');
        let code = msg.split("\*");
        let thing_name = code[0];
        let quantity = code[1];
         quantity=await convert2integer(quantity);
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
            if (code[1] == undefined) {
                x = await exist_najie_thing(usr_qq, thing_name, "装备");
            }
            else {
                pj = pj[code[1]];
                if (pj == undefined) return;
                x = await exist_najie_thing(usr_qq, thing_name, "装备", pj);
            }
            if (!x) {//没有
                e.reply(`你没有【${thing_name}】这样的装备`);
                return;
            }
            let equ;
            if (code[1] == undefined) {
                equ = najie.装备.find(item => item.name == thing_name);
                for (var i = 0; i < najie.装备.length; i++) {//遍历列表有没有比那把强的
                    if (najie.装备[i].name == thing_name && najie.装备[i].pinji > equ.pinji) {
                        equ = najie.装备[i];
                    }
                }
            }
            else {
                equ = najie.装备.find(item => item.name == thing_name && item.pinji == pj);
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
            let x = await exist_najie_thing(usr_qq, thing_name, thing_exist.class);
            if (!x) {
                e.reply(`你没有【${thing_name}】这样的【${thing_exist.class}】`);
                return;
            }
             quantity=await convert2integer(quantity)
               if(thing_name=="生肉"){
                 let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,2*quantity)
                e.reply(`服用成功,增加了${2*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
            if(thing_name=="熟肉"){
                let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,4*quantity)
                e.reply(`服用成功,增加了${4*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
            if(thing_name=="鱼肉"){
                   let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,2*quantity)
                e.reply(`服用成功,增加了${2*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
            if(thing_name=="烤鱼"){
                let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,4*quantity)
                e.reply(`服用成功,增加了${4*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
            if(thing_name=="苹果"){
                let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,2*quantity)
                e.reply(`服用成功,增加了${2*quantity}点饱食度`)
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
            if(thing_name=="西瓜"){
                let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,1*quantity)
                e.reply(`服用成功,增加了${1*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            } 
            if(thing_name=="土豆"){
                let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,1*quantity)
                e.reply(`服用成功,增加了${1*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
             if(thing_name=="烤土豆"){
                let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,3*quantity)
                e.reply(`服用成功,增加了${3*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
             if(thing_name=="胡萝卜"){
               let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,2*quantity)
                e.reply(`服用成功,增加了${2*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
            if(thing_name=="面包"){
               let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                     await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                    await Add_饱食度(usr_qq,3*quantity)
                    e.reply(`服用成功,增加了${3*quantity}点饱食度`)
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
            }
            if(thing_name=="腐肉"){
                 let shicai=await exist_najie_thing(usr_qq, thing_name, "食材")
                 if(shicai>=quantity){
                if(player.当前血量>0){
                await Add_najie_thing(usr_qq, thing_name, "食材", -quantity);
                await Add_饱食度(usr_qq,2*quantity)
                await Add_HP(usr_qq,-500000*quantity)
                e.reply(`服用成功,增加了${2*quantity}点饱食度,你还剩下${player.当前血量}点血量`)
                }
                return;
                 }else{
                     e.reply("你没有那么多的"+thing_name)
                     return;
                 }
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
                    await Add_najie_thing(usr_qq, thing_name, "丹药", quantity);
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
                        if (typeof action[i].biguan != "number" || action[i].biguan < 0) {
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
            if (this_danyao.type == '仙缘') {
                if (quantity != 1) {
                    e.reply(`只能服用一枚仙缘丹哦`);
                    await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);
                    return;
                }
                for (i = 0; i < action.length; i++) {
                    if (action[i].qq == usr_qq) {
                        if (action[i].ped <= 0 || typeof action[i].ped != 'number') {
                            action[i].ped = 5;

                        } else {
                            e.reply(`还有药力剩余,等使用完再服用吧`);
                            await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);
                            return;
                        }
                        action[i].beiyong1 = this_danyao.gailv;
                        if (action[i].beiyong1 > 0.3 && action[i].beiyong1 != 1) {
                            action[i].beiyong1 = 0.3
                        }
                    }
                }
                await redis.set(
                    'xiuxian:player:' + 10 + ':biguang',
                    JSON.stringify(action)
                );

                await data.setData('player', usr_qq, player);
                e.reply(
                    `${thing_name}赐予${player.名号}仙缘,${player.名号}得到了仙兽的祝福`
                );
                return;
            }
            if (this_danyao.type == '凝仙') {
                for (i = 0; i < action.length; i++) {
                    if (action[i].qq == usr_qq) {
                        if (action[i].beiyong1 == 1 || action[i].beiyong3 == 1) {
                            e.reply(`圣品丹药过于强大无法凝仙`)
                            await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity)
                            return;
                        } else {

                            if (action[i].biguan > 0) { action[i].biguan += this_danyao.机缘 * quantity }
                            if (action[i].lianti > 0) { action[i].lianti += this_danyao.机缘 * quantity }
                            if (action[i].ped > 0) { action[i].ped += this_danyao.机缘 * quantity }
                            if (action[i].beiyong2 > 0) { action[i].beiyong2 += this_danyao.机缘 * quantity }
                            e.reply(`丹韵入体,身体内蕴含的仙丹药效增加了${this_danyao.机缘 * quantity}次`)
                            await redis.set("xiuxian:player:" + 10 + ":biguang", JSON.stringify(action))
                        }

                        return;
                    }

                }
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
                        if (action[i].beiyong2 != 0) {
                            e.reply(`已经拥有神兽赐福了,下次再用吧`);
                            await Add_najie_thing(usr_qq, this_danyao.name, '丹药', quantity);
                            return;
                        }
                        if (action[i].beiyong2 > 0) {
                            action[i].beiyong2 += quantity
                        }
                        else {
                            action[i].beiyong2 = 3 * quantity
                        }
                        action[i].beiyong3 = this_danyao.概率
                        e.reply(`${player.名号}获得了神兽的恩赐,赐福的概率增加了,当前剩余次数${action[i].beiyong2}`)
                        await redis.set("xiuxian:player:" + 10 + ":biguang", JSON.stringify(action))
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
                        else
                        {
                            await Add_najie_thing(usr_qq, gongfa[i], "功法", -1);
                        }
                    }
                }
                player = await Read_player(usr_qq);
                player.lunhui = 0;
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
                        else
                        {
                            await Add_najie_thing(usr_qq, gongfa[i], "功法", -1);
                        }
                    }
                }
                player = await Read_player(usr_qq);
                player.lunhui = 0;
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
            let x = await exist_najie_thing(usr_qq, thing_name, thing_exist.class);
            if (!x) {
                e.reply(`你没有【${thing_name}】这样的【${thing_exist.class}】`);
                return;
            }
            if (thing_exist.type == "练气幻影卡面") {
                let photo = thing_exist.id
                if (player.练气皮肤 == photo) {
                    e.reply("您的卡面已经是" + thing_exist.name)
                    return
                }
                let old = data.daoju_list.find(item => item.id == player.练气皮肤)
                player.练气皮肤 = photo
                await Write_player(usr_qq, player)
                await Add_najie_thing(usr_qq, thing_name, "道具", -1)
                await Add_najie_thing(usr_qq, old.name, "道具", 1)
                e.reply("更换" + thing_exist.type + "【" + thing_exist.name + "】成功")
                return

            }
            if (thing_exist.type == "装备幻影卡面") {
                let photo = thing_exist.id
                if (player.装备皮肤 == photo) {
                    e.reply("您的卡面已经是" + thing_exist.name)
                    return
                }
                let old = data.kamian.find(item => item.id == player.装备皮肤)
                player.装备皮肤 = photo
                await Write_player(usr_qq, player)
                await Add_najie_thing(usr_qq, thing_name, "道具", -1)
                await Add_najie_thing(usr_qq, old.name, "道具", 1)
                e.reply("更换" + thing_exist.type + "【" + thing_exist.name + "】成功")
                return

            }
            if (thing_name == "分数") {
                await Add_najie_thing(usr_qq, "【剑法】残云封天剑", "装备", 1);
                await Add_najie_thing(usr_qq, thing_name, "草药", -1);
                e.reply(`成功兑换武器：《【剑法】残云封天剑》`);
                return
            }



            if (thing_name == "圣令") {
                await Add_najie_thing(usr_qq, "四圣麒麟甲", "装备", 1);
                await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                e.reply(`成功兑换：四圣麒麟甲`);
                return
            }

            if (thing_name == "武器造化机缘") {
                let l = data.wuqizaohua
                let rn = Math.floor(Math.random() * l.length + 1)
                let th = l[rn].name
                await Add_najie_thing(usr_qq, th, "装备", 1);
                await Add_najie_thing(usr_qq, thing_name, "装备", -1);
                e.reply(`成功兑换：` + th);
                return
            }
            if (thing_name == "护具造化机缘") {
                let l = data.hujuzaohua
                let rn = Math.floor(Math.random() * l.length + 1)
                let th = l[rn].name
                await Add_najie_thing(usr_qq, th, "装备", 1);
                await Add_najie_thing(usr_qq, thing_name, "装备", -1);
                e.reply(`成功兑换：` + th);
                return
            }
            if (thing_name == "法宝造化机缘") {
                let l = data.fabaozaohua
                let rn = Math.floor(Math.random() * l.length + 1)
                let th = l[rn].name
                await Add_najie_thing(usr_qq, th, "装备", 1);
                await Add_najie_thing(usr_qq, thing_name, "装备", -1);
                e.reply(`成功兑换：` + th);
                return
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
            if (thing_name == "熔炉") {
                player.熔炉=1;
                e.reply("熔炉放置成功");
                 await Write_player(usr_qq, player);
                await Add_najie_thing(usr_qq, "熔炉", "道具", -1);
                return
            }
            if (thing_name == "书架") {
                player.书架+=1;
                e.reply("书架放置成功");
                 await Write_player(usr_qq, player);
                await Add_najie_thing(usr_qq, "书架", "材料", -1);
                return
            }
            
            //寄术原因，写了很多多余的东西，但是能跑
            if (thing_name == "打火石") {
                let huoshi = await exist_najie_thing(usr_qq, "打火石", "道具")
                let number = await exist_najie_thing(usr_qq, "未点燃的火把", "道具")
                if (isNotNull(huoshi) && huoshi > 1 * quantity - 1) {
                    if (isNotNull(number) && number > 5 * quantity - 1) {
                        await Add_najie_thing(usr_qq, "火把", "道具", 5 * quantity);
                        await Add_najie_thing(usr_qq, "未点燃的火把", "道具", -5 * quantity);
                        await Add_najie_thing(usr_qq, "打火石", "道具", -quantity);
                        e.reply(["你使用打火石点燃了火把，获得火把" + 5 * quantity + "个"])
                        return
                    } else {
                        e.reply("你的未点燃的火把不足" + 5 * quantity + "个，你感觉太亏了，便放弃了")
                        return
                    }
                } else {
                    e.reply("你没有足够的" + thing_name)
                    return
                }
            }
if (thing_name == "寻宝工具盒") {
                let math=Math.random();
                if(math>0.6&&math<0.9){
                    await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具",1);
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    e.reply("你充满期待的打开了盒子，结果发现了一个雪铃零藏的新春木盒")
                    return;
                }else if(math>0.9&&math<1){
                    await Add_najie_thing(usr_qq, "木斧", "道具",1);
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    e.reply("你充满期待的打开了盒子，结果发现了一个木斧")
                    return;
                }else{
                        await Add_najie_thing(usr_qq, "猫猫藏的新春礼盒", "道具", 1);
                        await Add_najie_thing(usr_qq, thing_name, "道具",-1);
                        e.reply("你充满期待的打开了盒子，结果发现了一个猫猫藏的新春礼盒")
                        return
                }
            }
            if (thing_name == "猫猫藏的新春礼盒") {
                let math=Math.random();
                if(math>0.9&&math<1){
                    await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具",  1);
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    e.reply("你充满期待的打开了盒子，结果发现了一个清灵盒")
                    return;
                }else if(math>0&&math<0.3){
                  await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", 1); 
                   await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                  e.reply("你充满期待的打开了盒子，结果发现了里面只有一个雪铃盒")
                  return;
             }else{
                await Add_najie_thing(usr_qq, "闹钟藏的新春铁盒", "道具", 1); 
                   await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                  e.reply("你充满期待的打开了盒子，结果发现了里面有一个闹钟藏的新春铁盒")
                  return;
             }
            }
            if (thing_name == "闹钟藏的新春铁盒") {
                let math=Math.random();
                if(math==0.01){
                    await Add_najie_thing(usr_qq, "赤角石溃杵", "装备", 1); 
                   await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                  e.reply("你充满期待的打开了盒子，结果发现了里面有一个赤角石溃杵")
                  return;
                }
                if(math>0.01&&math<=0.25){
                    await Add_najie_thing(usr_qq, "百合花篮", "道具", 1); 
                   await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                  e.reply("你充满期待的打开了盒子，结果发现了里面有一个百合花篮")
                  return;
                }else if(math>0.25&&math<=0.50){
                    await Add_灵石(-1000000)
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    e.reply("你充满期待的打开了盒子，结果发现了里面是八个蛋,去医院花费了100w灵石")
                    return;
                }else if(math>0.5&&math<=0.75){
                     await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", 1); 
                   await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                  e.reply("你充满期待的打开了盒子，结果发现了里面有一个清灵藏的新春木盒")
                  return;
                }else {
                    await Add_najie_thing(usr_qq, "潘多拉魔盒", "盒子", 1); 
                    await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                    e.reply("你充满期待的打开了盒子，结果发现了是1个潘多拉魔盒")
                    return;
                }
            }
            if (thing_name == "雪铃零藏的新春木盒") {
                let math=Math.random();
                    if (math>0.9&&math<1) {
                        await Add_najie_thing(usr_qq, "玄土", "材料", 1000000);
                        await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                        e.reply(["你打开了雪铃零藏的新春木盒,里面有一袋玄土"])
                        return
                    }else if (math>0.8&&math<0.9) {
                        await Add_najie_thing(usr_qq, "秘境之匙", "道具", 2);
                        await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                        e.reply(["你打开了雪铃零藏的新春木盒，里面有一些钥匙"])
                        return
                    } else if (math>0.7&&math<0.8) {
                        await Add_灵石(usr_qq, -1000000);
                        await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                        e.reply(["你打开了雪铃零藏的新春木盒，未曾想里面是八个蛋，去医院消耗了100w灵石"])
                        return
                    }else{
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", 5);
                        await Add_najie_thing(usr_qq, "雪铃零藏的新春木盒", "道具", -1);
                        e.reply(["你打开了雪铃零藏的新春木盒，里面有5个清灵藏的新春木盒"])
                        return
                    }
            }
            if (thing_name == "清灵藏的新春木盒") {
                let math=Math.random();
             if(math>0.85&&math<=1){
                    await Add_najie_thing(usr_qq, "万妖王", "草药",1);
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", -1);
                        e.reply(["你打开了清灵藏的新春木盒，里面有一个万妖王"])
                        return
                }else if(math>0.70&&math<=0.85){
                    await Add_najie_thing(usr_qq, "地瓜岩龙", "草药",1);
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", -1);
                        e.reply(["你打开了清灵藏的新春木盒，里面有一个地瓜岩龙"])
                        return
                }else if(math>0.55&&math<=0.70){
                    await Add_najie_thing(usr_qq, "蓝银皇", "草药",1);
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", -1);
                        e.reply(["你打开了清灵藏的新春木盒，里面有一个蓝银皇"])
                        return
                }else if(math>0.40&&math<=0.55){
                    await Add_najie_thing(usr_qq, "八角玄冰草", "草药",1);
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", -1);
                        e.reply(["你打开了清灵藏的新春木盒，里面有一个八角玄冰草"])
                        return
                }else if(math>0.25&&math<=0.40){
                    await Add_najie_thing(usr_qq, "绮罗郁金香", "草药",1);
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", -1);
                        e.reply(["你打开了清灵藏的新春木盒，里面有一个绮罗郁金香"])
                        return
                }else if(math>0.10&&math<=0.25){
                    await Add_najie_thing(usr_qq, "烈火杏娇疏", "草药",1);
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", -1);
                        e.reply(["你打开了清灵藏的新春木盒，里面有一个烈火杏娇疏"])
                        return
                }else if(math>0&&math<=0.1){
                    await Add_najie_thing(usr_qq, "雷鸣阎狱藤", "草药",1);
                        await Add_najie_thing(usr_qq, "清灵藏的新春木盒", "道具", -1);
                        e.reply(["你打开了清灵藏的新春木盒，里面有一个雷鸣阎狱藤"])
                        return
                }
            }
               if (thing_name == "钓鱼掉上来的奇怪盒子") {
                let daomu = Math.random();
                    if (daomu==0.01) {
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子,里面什么都没有"])
                        return
                    }
                    if (daomu >0.01 && daomu <= 0.1) {
                        await Add_najie_thing(usr_qq, "经验球", "丹药",6 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有一些经验瓶"])
                        return
                    }
                    if (daomu > 0.1 && daomu <= 0.15) {
                        await Add_najie_thing(usr_qq, "经验瓶", "丹药",20 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有20个经验瓶"])
                        return
                    }
                    if (daomu > 0.15 && daomu <= 0.2) {
                        await Add_najie_thing(usr_qq, "经验瓶", "丹药",30 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有30个经验瓶"])
                        return
                    }
                    if (daomu > 0.25 && daomu <= 0.3) {
                        await Add_najie_thing(usr_qq, "血气瓶", "丹药",10);
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有10个血气瓶"])
                        return
                    }
                    if (daomu > 0.3 && daomu <= 0.4) {
                        await Add_najie_thing(usr_qq, "血气瓶", "丹药",5 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有5个血气瓶"])
                        return
                    }
                    if (daomu > 0.4 && daomu <= 0.5) {
                        await Add_najie_thing(usr_qq, "血气瓶", "丹药",4 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有4个血气瓶"])
                        return
                    }
                    if (daomu > 0.5 && daomu <= 0.7) {
                        await Add_najie_thing(usr_qq, "经验瓶", "丹药",4 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有4个经验瓶"])
                        return
                    }
                    if (daomu > 0.7 && daomu <= 0.8) {
                        await Add_najie_thing(usr_qq, "定灵珠", "道具",1 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有一个定灵珠"])
                        return
                    }
                    if (daomu > 0.8 && daomu <= 0.9) {
                        await Add_najie_thing(usr_qq, "起死回生丹", "丹药",1 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有一个起死回生丹"])
                        return
                    }
                    if (daomu > 0.9 && daomu <= 1) {
                        await Add_najie_thing(usr_qq, "重铸石", "道具",1 );
                        await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", -1);
                        e.reply(["你打开了钓鱼掉上来的奇怪盒子，里面有一个重铸石"])
                        return
                    }
            }
              if (thing_name == "煤炭") {
                let ranliao=await exist_najie_thing(usr_qq,"煤炭","材料");
                if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "煤炭", "材料", -quantity);
                    await Add_热量(usr_qq,9*quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
            }
        }
        if (thing_name == "木炭") {
                let ranliao=await exist_najie_thing(usr_qq,"木炭","材料");
               if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "木炭", "材料", -quantity);
                    await Add_热量(usr_qq,9*quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
            }
        }
        if (thing_name == "原木") {
                let ranliao=await exist_najie_thing(usr_qq,"原木","材料");
                if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "原木", "材料", -quantity);
                    await Add_热量(usr_qq,2*quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
            }
        }
    if (thing_name == "原木") {
                let ranliao=await exist_najie_thing(usr_qq,"木板","材料");
             if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "木板", "材料", -quantity);
                    await Add_热量(usr_qq,2*quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
            }
        }
if (thing_name == "木棍") {
                let ranliao=await exist_najie_thing(usr_qq,"木棍","材料");
              if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "木棍", "材料", -quantity);
                    await Add_热量(usr_qq,quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
            }
        }
if (thing_name == "羊毛") {
                let ranliao=await exist_najie_thing(usr_qq,"羊毛","食材");
               if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "羊毛", "食材", -quantity);
                    await Add_热量(usr_qq,quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
            }
        }
        if (thing_name == "皮革") {
                let ranliao=await exist_najie_thing(usr_qq,"皮革","食材");
                if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "皮革", "食材", -quantity);
                    await Add_热量(usr_qq,quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
            }
        }
         if (thing_name == "岩浆") {
                let ranliao=await exist_najie_thing(usr_qq,"岩浆","材料");
                if (player.熔炉==1){
                    if(ranliao<quantity){
                         e.reply('你似乎没有那么多'+thing_name)
                         return;
                    }
                    await Add_najie_thing(usr_qq, "岩浆", "材料", -quantity);
                    await Add_热量(usr_qq,500*quantity)
                    e.reply('添加成功,火烧的更旺了')
                    return;
                   
            }else{
                e.reply('你没有熔炉放个屁的燃料！')
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
                        else
                        {
                            await Add_najie_thing(usr_qq, gongfa[i], "功法", -1);
                        }
                    }
                }
                await Add_najie_thing(usr_qq, thing_name, "道具", -1);
                player = await Read_player(usr_qq);
                player.lunhui = 0;
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
            let player_id = await Read_player(usr_qq);
            let player = await Read_player(usr_qq);
            if (player.当前血量 < 200) {
                e.reply("你都伤成这样了,就不要出去浪了");
                return;
            }
            await Go(e);
            if (allaction) {
                console.log(allaction);
            } else {
                return;
            }
            allaction = false;
            var Time = 7;
            let now_Time = new Date().getTime(); //获取当前时间戳
            let shuangxiuTimeout = parseInt(60000 * Time);
            let last_time = await redis.get("xiuxian:player:" + usr_qq + "xunbaocd");//获得上次的时间戳,
            last_time = parseInt(last_time);
            if (now_Time < last_time + shuangxiuTimeout) {
            let Couple_m = Math.trunc((last_time + shuangxiuTimeout - now_Time) / 60 / 1000);
            let Couple_s = Math.trunc(((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000);
            e.reply("正在归来途中.....\n" + `还需要  ${Couple_m}分 ${Couple_s}秒。`);
            return;
            }
             let x = await exist_najie_thing(usr_qq, thing_name, thing_exist.class);
            if (!x) {
                e.reply(`你没有【${thing_name}】这样的地图`);
                return;
            }
            let random=Math.random();
            let newrandom=0.995
            if (random > newrandom) {
                let length = data.xianchonkouliang.length;
                let index = Math.trunc(Math.random() * length);
                let kouliang = data.xianchonkouliang[index];
                last_msg +=
                  '\n七彩流光的神奇仙谷[' +
                  kouliang.name +
                  ']深埋在土壤中，是仙兽们的最爱。';
                await Add_najie_thing(player_id, kouliang.name, '仙米', 1);
              }
            let last_msg='';
              let fyd_msg='';
              let shuangbei=Math.random();
              let math=Math.random();
                let n=1;
               let now_level_id=player.level_id;
               let now_physique_id=player.Physique_id;
              let t1 = 2 + Math.random();
                let t2 = 2 + Math.random();
                let xiuwei = Math.trunc( 2000 + (100 * now_level_id * now_level_id * t1 * 0.1) / 5);
                let xueqi = Math.trunc(2000 + 100 * now_physique_id * now_physique_id * t2 * 0.1);
               if (shuangbei < player.幸运) {
                  if (shuangbei < player.addluckyNo) {
                    last_msg += '福源丹生效，所以在';
                  } else if (player.仙宠.type == '幸运') {
                    last_msg += '仙宠使你在探索中欧气满满，所以在';
                  }
                  n *= 2;
                  last_msg += '本次探索中获得赐福加成\n';
                }
                if (player.islucky > 0) {
                  player.islucky--;
                  if (player.islucky != 0) {
                    fyd_msg = `  \n福源丹的效力将在${player.islucky}次探索后失效\n`;
                  } else {
                    fyd_msg = `  \n本次探索后，福源丹已失效\n`;
                    player.幸运 -= player.addluckyNo;
                    player.addluckyNo = 0;
                  }
                  await data.setData('player', player_id, player);
                }
           if(thing_name == "天衡山"){  
                if(player.饱食度< 1000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                let mugao=await exist_najie_thing(usr_qq, "木镐", "道具")
                let shigao=await exist_najie_thing(usr_qq, "石镐", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(mugao>0||shigao>0){
                           await Add_饱食度(usr_qq,-1000)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(mugao) && mugao >  quantity - 1){
                                await Add_najie_thing(usr_qq, "圆石", "材料", 3*n);
                                await Add_najie_thing(usr_qq, "木镐", "道具", -1);
                                mugao=1
                            }else{mugao=0;}
                            if(isNotNull(shigao) && shigao >  quantity - 1){
                                await Add_najie_thing(usr_qq, "圆石", "材料", 9*n);
                                await Add_najie_thing(usr_qq, "石镐", "道具", -1);
                                shigao=1
                            }else{shigao=0;}
                            await Add_najie_thing(usr_qq, "天衡山", "道具", -1);
                            await Add_灵石(usr_qq,150000)
                            await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0.9&&math<1){
                                await Add_najie_thing(usr_qq, "降诸魔山", "道具", 1*n);
                                e.reply(`你在天衡山捡到了15w灵石和圆石${3*mugao*n+9*shigao*n}以及降诸魔山地图${1*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.8&&math<0.9){
                                await Add_najie_thing(usr_qq, "煤炭", "材料",5*n);
                                e.reply(`你在天衡山捡到了15w灵石和圆石${3*mugao*n+9*shigao*n}以及煤炭${5*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.7&&math<0.8){
                                await Add_najie_thing(usr_qq, "泥土", "材料",30*n);
                                e.reply(`你在天衡山捡到了15w灵石和圆石${3*mugao*n+9*shigao*n}以及泥土${10*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else{
                                e.reply(`你在天衡山捡到了15w灵石和圆石${3*mugao*n+9*shigao*n},获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }
                        }else{
                            e.reply('你想起来你没有镐子,于是又回家了')
                            return;
                        }      
            }
              if(thing_name == "天臂池"){
                if(player.饱食度<1000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                let futou=await exist_najie_thing(usr_qq, "钓鱼竿", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(futou>0){
                            await Add_饱食度(usr_qq,-1000)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            await Add_najie_thing(usr_qq, "鱼肉", "食材", 100*n);      
                            await Add_najie_thing(usr_qq, "钓鱼竿", "道具", -1);
                            await Add_najie_thing(usr_qq, "天臂池", "道具", -1);
                            await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0.7&&math<=1){
                                await Add_najie_thing(usr_qq, "经验瓶", "丹药", n);
                                e.reply(`你运气真好，在天臂池钓到经验瓶${n}个,鱼肉${100*n},获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.3&&math<=0.7){
                                await Add_najie_thing(usr_qq, "经验球", "丹药",1);
                                e.reply(`你在天臂池钓到经验球${n}个,鱼肉${100*n},获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.01&&math<=0.3){
                                await Add_najie_thing(usr_qq, "血气瓶", "丹药",n);
                                e.reply(`你在天臂池钓到血气瓶${n}个,鱼肉${100*n},获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0&&math<=0.01){
                               await Add_najie_thing(usr_qq, "经验瓶", "丹药", n*10);
                                e.reply(`你运气爆棚了！在天臂池钓到经验瓶${n*10}个,鱼肉${100*n},获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }
                        }else{
                              e.reply('你发现你没带钓鱼竿，所以回家了')
                              return;
                        }   
            }
             if(thing_name == "星落湖"){
                if(player.饱食度<1000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
               if(now_level_id<41){
                e.reply("你是仙人吗就去星落湖");
                 return;
           }
                let futou=await exist_najie_thing(usr_qq, "钓鱼竿", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(futou>0){
                           await Add_饱食度(usr_qq,-1000)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            await Add_najie_thing(usr_qq, "鱼肉", "食材", 100*n);      
                            await Add_najie_thing(usr_qq, "钓鱼竿", "道具", -1);
                            await Add_najie_thing(usr_qq, "星落湖", "道具", -1);
                            await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0.9&&math<=1){
                                await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", n*2); 
                                e.reply(`你运气太好了,钓上来了钓鱼掉上来的奇怪盒子${2*n}个,还有一些鱼肉`)
                                return;
                            }else{
                                await Add_najie_thing(usr_qq, "钓鱼掉上来的奇怪盒子", "道具", n); 
                                e.reply(`你钓到了一些鱼,钓鱼掉上来的奇怪盒子${n}个`)
                                return;
                            }
                        }else{
                              e.reply('你发现你没带钓鱼竿，所以回家了')
                              return;
                        }   
            }
            if(thing_name == "低语森林"){
                if(player.饱食度<500){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                let futou=await exist_najie_thing(usr_qq, "木斧", "道具")
                let shifu=await exist_najie_thing(usr_qq, "石斧", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(futou>0||shifu>0){
                            await Add_饱食度(usr_qq,-500)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(futou) && futou>  0){
                                await Add_najie_thing(usr_qq, "原木", "材料", 3*n);
                                await Add_najie_thing(usr_qq, "木斧", "道具", -1);
                                futou=1
                            }else{futou=0;}
                            if(isNotNull(shifu) && shifu >  0){
                                await Add_najie_thing(usr_qq, "原木", "材料", 9*n);
                                await Add_najie_thing(usr_qq, "石斧", "道具", -1);
                                shifu=1
                            }else{shifu=0;}
                            await Add_najie_thing(usr_qq, "低语森林", "道具", -1);
                            await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0&&math<=0.3){
                                await Add_najie_thing(usr_qq, "水天丛林", "道具", 1*n);
                                e.reply(`你在低语森林捡到了原木${3*futou*n+9*shifu*n}个和一个水天丛林地图,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.8&&math<0.9){
                                await Add_najie_thing(usr_qq, "苹果", "食材",32*n);
                                e.reply(`你在低语森林捡到了原木${3*futou*n+9*shifu*n}个和苹果${32*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.7&&math<0.8){
                                await Add_najie_thing(usr_qq, "泥土", "材料",10*n);
                                e.reply(`你在低语森林捡到了原木${3*futou*n+9*shifu*n}个和泥土${10*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.6&&math<0.7){
                                await Add_najie_thing(usr_qq, "树苗", "食材",1*n);
                                e.reply(`你在低语森林捡到了原木${3*futou*n+9*shifu*n}个和树苗${1*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else{
                                e.reply(`你在低语森林捡到了原木${3*futou*n+9*shifu*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }
                        }else{
                           await Add_najie_thing(usr_qq, "原木", "材料", 1*n);      
                            await Add_najie_thing(usr_qq, "低语森林", "道具", -1);
                            await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                              e.reply(`你因为没带斧头,所以只捡到了原木${1*n}个,获得了修为${xiuwei}血气${xueqi}`)
                               player.饱食度-=500;
                            await Write_player(usr_qq, player);
                            return;
                        }   
            }
            if(thing_name == "水天丛林"){
                if(player.饱食度<1000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                let futou=await exist_najie_thing(usr_qq, "木斧", "道具")
                let shifu=await exist_najie_thing(usr_qq, "石斧", "道具")
                
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(futou>0||shifu>0){
                            await Add_饱食度(usr_qq,-1000)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(futou) && futou>  0){
                                await Add_najie_thing(usr_qq, "原木", "材料", 10*n);
                                await Add_najie_thing(usr_qq, "木斧", "道具", -1);
                                futou=1
                            }else{futou=0;}
                            if(isNotNull(shifu) && shifu >  0){
                                await Add_najie_thing(usr_qq, "原木", "材料", 20*n);
                                await Add_najie_thing(usr_qq, "石斧", "道具", -1);
                                shifu=1
                            }else{shifu=0;}
                            await Add_najie_thing(usr_qq, "水天丛林", "道具", -1);
                             await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0.9&&math<1){
                                await Add_najie_thing(usr_qq, "深渊", "道具", 1);
                                e.reply(`你在水天丛林捡到了原木${5*futou*n+15*shifu*n}个和深渊地图${1}个,,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.8&&math<0.9){
                                await Add_najie_thing(usr_qq, "西瓜", "食材",128*n);
                                e.reply(`你在水天丛林捡到了原木${5*futou*n+15*shifu*n}个和西瓜${128*n},,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.7&&math<0.8){
                                await Add_najie_thing(usr_qq, "泥土", "材料",25*n);
                                e.reply(`你在水天丛林捡到了原木${5*futou*n+15*shifu*n}个和泥土${25*n},获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else if(math>0.7&&math<0.8){
                                await Add_najie_thing(usr_qq, "树苗", "食材",5*n);
                                e.reply(`你在水天丛林捡到了原木${5*futou*n+15*shifu*n}个和树苗${5*n},获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }else{
                                e.reply(`你在水天丛林捡到了原木${5*futou*n+15*shifu*n}个,获得了修为${xiuwei}血气${xueqi}`)
                                return;
                            }
                        }else{
                            e.reply('你想起来你没有斧头,于是又回家了')
                            return;
                        }
            }
            if(thing_name == "恒那兰那"){  
                if(player.饱食度<=100){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                let muchan=await exist_najie_thing(usr_qq, "木铲", "道具")
                let shichan=await exist_najie_thing(usr_qq, "石铲", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(muchan>0||shichan>0){
                            await Add_饱食度(usr_qq,-100)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(muchan) && muchan>  quantity - 1){
                                await Add_najie_thing(usr_qq, "胡萝卜", "食材", 150*n);
                                await Add_najie_thing(usr_qq, "土豆", "食材", 150*n);
                                await Add_najie_thing(usr_qq, "木铲", "道具", -1);
                                muchan=1
                            }else{muchan=0;}
                            if(isNotNull(shichan) && shichan >  quantity - 1){
                                await Add_najie_thing(usr_qq, "胡萝卜", "食材", 300*n);
                                await Add_najie_thing(usr_qq, "土豆", "食材", 300*n);
                                await Add_najie_thing(usr_qq, "石铲", "道具", -1);
                                shichan=1
                            }else{shichan=0;}
                            await Add_najie_thing(usr_qq, "恒那兰那", "道具", -1);
                             await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0.90&&math<=1){
                                await Add_najie_thing(usr_qq, "铁矿", "材料",2*n);
                                e.reply(`你在恒那兰那捡到了胡萝卜${150*muchan*n+300*n*shichan}个和土豆${150*muchan*n+300*n*shichan}个,在猪人箱子里找到铁矿${2*n}个`)
                                return;
                            }else if(math>0.8&&math<=0.9){
                                await Add_najie_thing(usr_qq, "煤炭", "材料",5*n);
                                e.reply(`你在恒那兰那捡到了胡萝卜${150*muchan*n+300*n*shichan}个和土豆${150*muchan*n+300*n*shichan}个,在猪人箱子里找到煤炭${5*n}个`)
                                return;
                            }else if(math>0&&math<=0.2){
                                await Add_najie_thing(usr_qq, "轻策庄", "道具",1*n);
                                e.reply(`你在恒那兰那捡到了胡萝卜${150*muchan*n+300*n*shichan}个和土豆${150*muchan*n+300*n*shichan}个,在猪人箱子里找到轻策庄地图${1*n}个`)
                                return;
                            }else if(math>0.7&&math<=0.8){
                                await Add_najie_thing(usr_qq, "书架", "材料",5*n);
                                e.reply(`你在恒那兰那捡到了胡萝卜${150*muchan*n+300*n*shichan}个和土豆${150*muchan*n+300*n*shichan}个,在猪人家里找到书架${5*n}个`)
                                return;
                            }else{
                                e.reply(`你在恒那兰那捡到了胡萝卜${150*muchan*n+300*n*shichan}个和土豆${150*muchan*n+300*n*shichan}个`)
                                return;
                            }
                        }else{
                            e.reply('你想起来你没有铲子,于是又回家了')
                            return;
                        }
            
            }
            if(thing_name == "轻策庄"){  
                if(player.饱食度<100){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                let muchan=await exist_najie_thing(usr_qq, "铁铲", "道具")
                let shichan=await exist_najie_thing(usr_qq, "金铲", "道具")
                let zuanshichan=await exist_najie_thing(usr_qq, "钻石铲", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(muchan>0||shichan>0||zuanshichan>0){
                             await Add_饱食度(usr_qq,-100)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(muchan) && muchan> 0){
                                 muchan=1
                                await Add_najie_thing(usr_qq, "小麦", "食材", 1000*muchan*n);
                                await Add_najie_thing(usr_qq, "铁铲", "道具", -1*muchan);
                            }else{muchan=0;}
                            if(isNotNull(shichan) && shichan > 0){
                                shichan=1
                                await Add_najie_thing(usr_qq, "小麦", "食材",1000*shichan*n);
                                await Add_najie_thing(usr_qq, "金铲", "道具", -1*shichan);
                            }else{shichan=0;}
                            if(isNotNull(zuanshichan) && zuanshichan >0){
                                zuanshichan=1
                                await Add_najie_thing(usr_qq, "小麦", "食材", 2000*zuanshichan*n);
                                await Add_najie_thing(usr_qq, "钻石铲", "道具", -1*zuanshichan);
                            }else{zuanshichan=0;}
                            await Add_najie_thing(usr_qq, "轻策庄", "道具", -1);
                             await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0.9&&math<=1){
                                await Add_najie_thing(usr_qq, "书架", "材料", 5);
                                e.reply(`你在轻策庄捡到了小麦${1000*muchan*n+1000*shichan*n+2000*zuanshichan*n}个和书架${5*n}`)
                                return;
                            }else if(math>0.8&&math<=0.9){
                                await Add_najie_thing(usr_qq, "书本", "材料",15);
                                e.reply(`你在轻策庄捡到了小麦${1000*muchan*n+1000*shichan*n+2000*zuanshichan*n}个和书本${15*n}`)
                                return;
                            }else if(math>0.7&&math<=0.8){
                                await Add_najie_thing(usr_qq, "甘蔗", "食材",10);
                                e.reply(`你在轻策庄捡到了小麦${1000*muchan*n+1000*shichan*n+2000*zuanshichan*n}个和甘蔗${10*n}`)
                                return;
                            }else if(math>0.6&&math<=0.7){
                                await Add_najie_thing(usr_qq, "黑曜石", "材料",5);
                                e.reply(`你在轻策庄捡到了小麦${1000*muchan*n+1000*shichan*n+2000*zuanshichan*n}个和黑曜石${5*n}`)
                                return;
                            }else if(math>0&&math<=0.1){
                                await Add_najie_thing(usr_qq, "深渊", "道具",1);
                                e.reply(`你在轻策庄捡到了小麦${1000*muchan*n+1000*shichan*n+2000*zuanshichan*n}个和深渊地图${1}个`)
                                return;
                            }else{
                                e.reply(`你在轻策庄捡到了小麦${1000*muchan*n+1000*shichan*n+2000*zuanshichan*n}个`)
                                return;
                            }
                        }else{
                            e.reply('你想起来你没有铲子,于是又回家了')
                            return;
                        }
            }
           if(thing_name == "降诸魔山"){  
                if(player.饱食度< 2000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                let kouxue=parseInt(player.血量上限*0.25)
                let mugao=await exist_najie_thing(usr_qq, "铁镐", "道具")
                let shigao=await exist_najie_thing(usr_qq, "石镐", "道具")
                
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                let huoba=await exist_najie_thing(usr_qq, "火把", "道具")
                if(huoba<30){
                    e.reply('你的火把不够,先去弄一些火把再来吧');
                    return;
                }
                        if(mugao>0||shigao>0){
                            await Add_饱食度(usr_qq,-2000)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(mugao) && mugao >  quantity - 1){
                                mugao=1;
                                await Add_najie_thing(usr_qq, "圆石", "材料", 18*mugao*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", 18*mugao*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", 9*mugao*n);
                                await Add_najie_thing(usr_qq, "铁镐", "道具", -1*mugao);
                            }else{mugao=0;}
                            if(isNotNull(shigao) && shigao >  quantity - 1){
                                mugao=1;
                                await Add_najie_thing(usr_qq, "圆石", "材料", 9*shigao*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", 9*shigao*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", 3*shigao*n);
                                await Add_najie_thing(usr_qq, "石镐", "道具", -1*shigao);
                            }else{shigao=0;}
                            await Add_najie_thing(usr_qq, "降诸魔山", "道具", -1);
                            await Add_najie_thing(usr_qq, "火把", "道具", -30);
                            await Add_灵石(usr_qq,150000)
                             await Add_血气(usr_qq,xiuwei)
                            await Add_修为(usr_qq,xueqi)
                            if(math>0.9&&math<1){
                                await Add_najie_thing(usr_qq, "星荧洞窟", "道具", 1*n);
                                e.reply(`你在降诸魔山捡到了15w灵石和挖到圆石${18*mugao*n+9*shigao*n}个,
                                煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,和星荧洞窟地图${1*n}个`)
                                return;
                            }else if(math>0.8&&math<0.9){
                                await Add_HP(usr_qq,-kouxue)
                                await Add_najie_thing(usr_qq, "腐肉", "食材", 32*n);
                                e.reply(`你在降诸魔山捡到了15w灵石和挖到圆石${18*mugao*n+9*shigao*n}个,
                                煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,
                                '在探索途中遇到一些僵尸,你击败了他们,剩余${player.当前血量}血量,捡到腐肉${32*n}个`)
                                return;
                            }else if(math>0.7&&math<0.8){
                                await Add_HP(usr_qq,-kouxue)
                                await Add_najie_thing(usr_qq, "骨头", "材料", 5*n);
                                e.reply(`你在降诸魔山捡到了15w灵石和挖到圆石${18*mugao*n+9*shigao*n}个,
                                煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,
                                '在探索途中遇到一些骷髅,你击败了他们,剩余${player.当前血量}血量,捡到骨头${5*n}个`)
                                return;
                            }else if(math>0.6&&math<0.7){
                                await Add_HP(usr_qq,-kouxue*4)
                                await Add_najie_thing(usr_qq, "圆石", "材料", -18*mugao*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", -18*mugao*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", -9*mugao*n);
                                await Add_najie_thing(usr_qq, "圆石", "材料", -9*shigao*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", -9*shigao*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", -3*shigao*n);
                                await Add_灵石(usr_qq,-150000)
                                e.reply('你在挖矿途中一只苦力怕靠近你然后爆炸了,你来不及反应,剩余'+player.当前血量+'血量，你什么都没有得到')
                                return;
                            }else{
                                e.reply(`你在降诸魔山捡到了15w灵石和挖到圆石${18*mugao*n+9*shigao*n}个,
                                煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个`)
                                return;
                            }
                        }else{
                            e.reply('你想起来你没有镐子,于是又回家了')
                            return;
                        }  
            }
           if(thing_name == "星荧洞窟"){
                if(player.饱食度<3000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                if(now_level_id<41){
                    e.reply("你是仙人吗就去星荧洞窟");
                     return;
               }
                let kouxue=parseInt(player.血量上限*0.25)
                let mugao=await exist_najie_thing(usr_qq, "铁镐", "道具")
                let shigao=await exist_najie_thing(usr_qq, "石镐", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                        if(mugao>0||shigao>0){
                            await Add_饱食度(usr_qq,-3000)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(mugao) && mugao >  quantity - 1){
                                await Add_najie_thing(usr_qq, "圆石", "材料", 18*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", 18*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", 9*n);
                                await Add_najie_thing(usr_qq, "黄金矿", "材料", 9*n);
                                await Add_najie_thing(usr_qq, "铁镐", "道具", -1);
                                mugao=1;
                            }else{mugao=0;}
                            if(isNotNull(shigao) && shigao >  quantity - 1){
                                await Add_najie_thing(usr_qq, "圆石", "材料", 9*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", 9*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", 3*n);
                                await Add_najie_thing(usr_qq, "石镐", "道具", -1);
                                shigao=1;
                            }else{shigao=0;}
                            await Add_najie_thing(usr_qq, "星荧洞窟", "道具", -1);
                            if(math>0.9&&math<=1){
                                await Add_najie_thing(usr_qq, "层岩巨渊", "道具", 1*n);
                                e.reply(`你在星荧洞窟捡到了挖到圆石${18*mugao*n+9*shigao*n}个,
                                    煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,黄金矿${9*mugao*n}个和层岩巨渊地图${1*n}个`)
                            }else if(math>0.1&&math<=0.3){
                                await Add_HP(usr_qq,-kouxue)
                                await Add_najie_thing(usr_qq, "腐肉", "食材", 64*n);
                                e.reply(`你在星荧洞窟捡到了挖到圆石${18*mugao*n+9*shigao*n}个,
                                    煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,黄金矿${9*mugao*n}个,
                                '在探索途中遇到一些僵尸,你击败了他们,剩余${player.当前血量}捡到腐肉${64*n}个`)
                            }else if(math>0.3&&math<=0.5){
                                await Add_HP(usr_qq,-kouxue)
                                await Add_najie_thing(usr_qq, "骨头", "材料", 10*n);
                                e.reply(`你在星荧洞窟捡到了挖到圆石${18*mugao*n+9*shigao*n}个,
                                    煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,黄金矿${9*mugao*n}个,
                                在探索途中遇到一些骷髅,你击败了他们,剩余${player.当前血量}捡到骨头${10*n}个`)
                            }else if(math>0.8&&math<=0.9){
                                await Add_najie_thing(usr_qq, "红石", "材料",128*n);
                                e.reply(`你在星荧洞窟捡到了挖到圆石${18*mugao*n+9*shigao*n}个,
                                    煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,黄金矿${9*mugao*n}个和红石${128*n}个`)
                            }else if(math==0.01){
                                await Add_najie_thing(usr_qq, "圆石", "材料", -18*mugao*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", -18*mugao*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", -9*mugao*n);
                                await Add_najie_thing(usr_qq, "金矿", "材料", -9*mugao*n);
                                await Add_najie_thing(usr_qq, "圆石", "材料", 9*shigao*n);
                                await Add_najie_thing(usr_qq, "煤炭", "材料", 9*shigao*n);
                                await Add_najie_thing(usr_qq, "铁矿", "材料", 3*shigao*n);
                                await Add_HP(usr_qq,-kouxue*4)
                                await Add_灵石(usr_qq,-1000000)
                                e.reply('你在挖矿途中一只苦力怕靠近你然后爆炸了,你来不及反应,剩余'+player.当前血量+'你什么都没有得到')
                            }else{
                                e.reply(`你在星荧洞窟捡到了挖到圆石${18*mugao*n+9*shigao*n}个,
                                    煤炭${18*mugao*n+9*shigao*n}个,铁矿${9*mugao*n+3*shigao*n}个,黄金矿${9*mugao*n}个`)
                            }
                        }else{
                            e.reply('你想起来你没有石镐或铁镐,于是又回家了')
                            return;
                        }
                    }
            if(thing_name == "层岩巨渊"){  
                if(player.饱食度<=5000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                if(now_level_id<41){
                    e.reply("你是仙人吗就去层岩巨渊");
                     return;
               }
                let kouxue=parseInt(player.血量上限*0.25)
                let muchan=await exist_najie_thing(usr_qq, "铁镐", "道具")
                let shichan=await exist_najie_thing(usr_qq, "金镐", "道具")
                let zuanshichan=await exist_najie_thing(usr_qq, "钻石镐", "道具")
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                let huoba=await exist_najie_thing(usr_qq, "火把", "道具")
                if(huoba<60){
                    e.reply('你的火把不够,先去弄一些火把再来吧');
                    return;
                }
                        if(muchan>0||shichan>0||zuanshichan>0){
                            let heiyaoshi=false;
                            await Add_饱食度(usr_qq,-5000)
                            await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                            if (isNotNull(muchan) && muchan>  quantity - 1){
                                muchan=1;
                                await Add_najie_thing(usr_qq, "圆石", "材料", 18*muchan*n);
                                await Add_najie_thing(usr_qq, "钻石", "材料",3*muchan*n);
                                await Add_najie_thing(usr_qq, "青金石", "材料",9*muchan*n);
                                await Add_najie_thing(usr_qq, "铁镐", "道具", -1*muchan);
                            }else{muchan=0;}
                            if(isNotNull(shichan) && shichan >  quantity - 1){
                                 shichan=1;
                                await Add_najie_thing(usr_qq, "圆石", "材料", 18*shichan*n);
                                await Add_najie_thing(usr_qq, "钻石", "材料",3*shichan*n);
                                await Add_najie_thing(usr_qq, "青金石", "材料",9*shichan*n);
                                await Add_najie_thing(usr_qq, "金镐", "道具", -1*shichan);
                            }else{shichan=0;}
                            if(isNotNull(zuanshichan) && zuanshichan >  quantity - 1){
                               zuanshichan=1;
                                await Add_najie_thing(usr_qq, "圆石", "材料", 18*zuanshichan*n);
                                await Add_najie_thing(usr_qq, "钻石", "材料",9*zuanshichan*n);
                                await Add_najie_thing(usr_qq, "青金石", "材料",18*zuanshichan*n);
                                await Add_najie_thing(usr_qq, "钻石镐", "道具", -1*zuanshichan);
                                await Add_najie_thing(usr_qq, "黑曜石", "材料",12*n);
                                 heiyaoshi=true;
                            }else{zuanshichan=0;}
                            await Add_najie_thing(usr_qq, "层岩巨渊", "道具", -1);
                             await Add_najie_thing(usr_qq, "火把", "道具", -60);
                           if(math>0&&math<0.1){
                                await Add_najie_thing(usr_qq, "深渊", "道具",1);
                                if(heiyaoshi==true){
                                e.reply(`你在层岩巨渊捡到了20w灵石挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,黑曜石${12*n},找到了一个深渊地图`)
                                return;
                                }else{
                                e.reply(`你在层岩巨渊捡到了20w灵石挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,找到了一个深渊地图`)
                                 return;
                                }
                            }else if(math>0.9&&math<1){
                                await Add_HP(usr_qq,-kouxue)
                                await Add_najie_thing(usr_qq, "腐肉", "食材", 128*n);
                                if(heiyaoshi==true){
                                e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,黑曜石${12*n},
                                在探索途中遇到一些僵尸,你击败了他们,剩余${player.当前血量}捡到腐肉${128*n}个`)
                                }else{
                                    e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,
                                在探索途中遇到一些僵尸,你击败了他们,剩余${player.当前血量}捡到腐肉${128*n}个`)
                                }
                            }else if(math>0.8&&math<0.9){
                                await Add_HP(usr_qq,-kouxue)
                                await Add_najie_thing(usr_qq, "骨头", "材料", 20*n);
                                if(heiyaoshi==true){
                                e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,黑曜石${12*n}个,
                                在探索途中遇到一些骷髅,你击败了他们,剩余${player.当前血量}捡到骨头${20*n}个`)
                                }else{
                                     e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,
                                在探索途中遇到一些骷髅,你击败了他们,剩余${player.当前血量}捡到骨头${20*n}个`)
                                }
                            }else if(math>0.3&&math<=0.5){
                                await Add_najie_thing(usr_qq, "红石", "材料",256*n);
                                if(heiyaoshi==true){
                                e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,
                                红石${256*n}个，黑曜石${12*n}个,`)
                                }else{
                                e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,
                                红石${256*n}个`)
                                }
                            }else{
                                if(heiyaoshi==true){
                                e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个,,黑曜石${12*n}个`) 
                                }else{
                                e.reply(`你在层岩巨渊捡到了20w灵石和挖到圆石${18*muchan*n+18*shichan*n+18*zuanshichan*n}个,
                                钻石${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,
                                青金石${9*muchan*n+9*shichan*n+18*zuanshichan*n}个`)
                                }
                            }
                        }else{
                            e.reply('你想起来你没有镐子,于是又回家了')
                            return;
                        }
            }
            if(thing_name == "深渊"){  
                if(player.饱食度<=10000){
                    e.reply('你快饿死了,还是先吃点东西吧');
                    return;
                }
                if(now_level_id<41){
                    e.reply("你是仙人吗就去深渊");
                     return;
               }
                if(player.修为<10000000){
                    e.reply("你需要积累1000w修为才能抵御深渊魔气");
                    return;
                }
                if (quantity > 1) {
                    e.reply("地图一次只能使用一个")
                    return;
                }
                let shenyuan=await exist_najie_thing(usr_qq, "深渊传送门", "道具")
                if(shenyuan<1){
                            e.reply('你的传送门不足')
                            return;
                }
                let huoba=await exist_najie_thing(usr_qq, "火把", "道具")
                if(huoba<120){
                    e.reply('你的火把不够,先去弄一些火把再来吧');
                    return;
                }
                let muchan=await exist_najie_thing(usr_qq, "铁镐", "道具")
                let shichan=await exist_najie_thing(usr_qq, "金镐", "道具")
                let zuanshichan=await exist_najie_thing(usr_qq, "钻石镐", "道具")
                n=1;
                if(muchan>0||shichan>0||zuanshichan>0){
                    await redis.set("xiuxian:player:" + usr_qq + "xunbaocd", now_Time);
                    if (isNotNull(muchan) && muchan> 0){
                        muchan=1
                        await Add_najie_thing(usr_qq, "深渊石", "材料", 18*muchan*n);
                        await Add_najie_thing(usr_qq, "下界合金矿", "材料", 3*muchan*n);
                        await Add_najie_thing(usr_qq, "铁镐", "道具", -1*muchan);
                    }else{muchan=0;}
                    if(isNotNull(shichan) && shichan > 0){
                        shichan=1
                        await Add_najie_thing(usr_qq, "深渊石", "材料", 18*shichan*n);
                        await Add_najie_thing(usr_qq, "下界合金矿", "材料", 3*shichan*n);
                        await Add_najie_thing(usr_qq, "金镐", "道具", -1*shichan);
                    }else{shichan=0;}
                    if(isNotNull(zuanshichan) &&zuanshichan> 0){
                        zuanshichan=1
                        await Add_najie_thing(usr_qq, "深渊石", "材料", 36*zuanshichan*n);
                        await Add_najie_thing(usr_qq, "下界合金矿", "材料", 9*zuanshichan*n);
                        await Add_najie_thing(usr_qq, "钻石镐", "道具", -1*zuanshichan);
                    }else{zuanshichan=0;}
                    await Add_najie_thing(usr_qq, "火把", "道具", -120);
                    await Add_najie_thing(usr_qq, "深渊", "道具", -1);
                    await Add_修为(usr_qq,-10000000)
                    await Add_饱食度(usr_qq,-10000)
                  if(math>0.9&&math<=1){
                    await Add_najie_thing(usr_qq, "七星海棠丹", "丹药", 1*n);
                    e.reply(`你在深渊捡到了深渊石${18*muchan*n+18*shichan*n+36*zuanshichan*n}个,
                    下界合金矿${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,还有七星海棠丹一个`)
                    return;
                  }else if(math>0.6&&math<=0.9){
                    await Add_najie_thing(usr_qq, "深渊石", "材料", 100*n);
                    e.reply(`你在深渊捡到了深渊石${18*muchan*n+18*shichan*n+36*zuanshichan*n}个,
                    下界合金矿${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,额外捡到深渊石${100*n}个`)
                    return;
                  }else if(math>0.1&&math<=0.2){
                    await Add_najie_thing(usr_qq, "经验球", "丹药", 100*n);
                    e.reply(`你在深渊捡到了深渊石${18*muchan*n+18*shichan*n+36*zuanshichan*n}个,
                    下界合金矿${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,经验球${100*n}个`)
                    return;
                  }else if(math>0.2&&math<=0.3){
                    await Add_najie_thing(usr_qq, "血气瓶", "丹药", 25*n);
                    e.reply(`你在深渊捡到了深渊石${18*muchan*n+18*shichan*n+36*zuanshichan*n}个,
                    下界合金矿${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,血气瓶${25*n}个`)
                    return;
                  }else if(math>0.3&&math<=0.5){
                    await Add_najie_thing(usr_qq, "经验瓶", "丹药", 40*n);
                    e.reply(`你在深渊捡到了深渊石${18*muchan*n+18*shichan*n+36*zuanshichan*n}个,
                    下界合金矿${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,经验瓶${40*n}个`)
                    return;
                  }else{
                    await Add_najie_thing(usr_qq, "岩浆", "材料", 10*n);
                    e.reply(`你在深渊捡到了深渊石${18*muchan*n+18*shichan*n+36*zuanshichan*n}个,
                    下界合金矿${3*muchan*n+3*shichan*n+9*zuanshichan*n}个,岩浆${10*n}个`)
                    return;
                  }
        }else{
            e.reply('你想起来你没有镐子,于是又回家了')
            return;
        }
    }
         }
     if (func == "合成"){
            let wupin=data.hecheng_list.find(item=>item.name==thing_name);
            if (!isNotNull(wupin)) {
                e.reply(`合成物品暂时未添加，请持续关注`);
                return;
            }
            //看物品是否够
            for (let i = 0; i < wupin.materials.length; i++) {
                const material = wupin.materials[i];
                let x = await exist_najie_thing(usr_qq, material.name, material.class);
                if(x==false){
                    x=0;
                }
                if(x < material.amount*quantity){
                    e.reply(`纳戒中拥有${material.name}${x}份，合成需要${material.amount*quantity}份`);
                    return;
                }
            }                
            //纳戒中减去对应物品
            for (let i = 0; i < wupin.materials.length; i++) {
                const material = wupin.materials[i];
                await Add_najie_thing(usr_qq,material.name,material.class,-material.amount*quantity)
            }
            await Add_najie_thing(usr_qq,wupin.name,wupin.class,wupin.amount*quantity);
            e.reply(`合成成功，获得${wupin.name}${wupin.amount*quantity}个`);
            return;
        }
        if (func == "加工") {
            let wupin=data.jiagong_list.find(item=>item.name==thing_name);
            if (!isNotNull(wupin)) {
                e.reply(`加工物品暂时未添加，请持续关注`);
                return;
            }
            //看物品是否够
            for (let i = 0; i < wupin.inputs.length; i++) {
                const input = wupin.inputs[i];
                let x = await exist_najie_thing(usr_qq, input.name, input.class);
                if(x==false){
                    x=0;
                }
                if(x < input.amount*quantity+input.const_amount){
                    e.reply(`纳戒中拥有${input.name}${x}份，加工需要${input.amount*quantity+input.const_amount}份`);
                    return;
                }
            }
            //看热量是否够
            if (player.热量<wupin.热量*quantity) {
                e.reply(`加工需要热量${wupin.热量*quantity}，现在不足！`);
                return;
            }
            //减去加工消耗的热量
            await Add_热量(usr_qq,-(wupin.热量*quantity));
            //纳戒中减去对应输入物品
            for (let i = 0; i < wupin.inputs.length; i++) {
                const input = wupin.inputs[i];
                await Add_najie_thing(usr_qq,input.name,input.class,-(input.amount*quantity+input.const_amount));
            }
            //纳戒中加上对应输出物品
            let msg=[];
            for (let i = 0; i < wupin.outputs.length; i++) {
                const output = wupin.outputs[i];
                await Add_najie_thing(usr_qq,output.name,output.class,(output.amount*quantity+output.const_amount));
                msg.push(`获得${output.name}${output.amount*quantity+output.const_amount}个`);
            }
            e.reply(`加工成功，${msg}`);
            return;
        }
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
        commodities_price = Math.trunc(commodities_price);
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
        let thing_name = code[0]; //物品
        let thing_amount = code[1];//数量
        let thing_piji; //品级
        //判断列表中是否存在，不存在不能卖,并定位是什么物品
        let najie = await Read_najie(usr_qq);
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`这方世界没有[${thing_name}]`);
            return;
        }
        if (thing_exist.id >= 400991 && thing_exist.id <= 400999) {
            e.reply(`轮回功法${thing_name}禁止出售。`)
            return;
        }
        //确定数量和品级
        let pj = {
            "劣": 0,
            "普": 1,
            "优": 2,
            "精": 3,
            "极": 4,
            "绝": 5,
            "顶": 6
        }
        pj = pj[code[1]]
        if (pj != undefined) {
            thing_piji = code[1];;
            thing_amount = code[2]//数量
        }
        else {
            if (thing_exist.class == "装备") {
                let equ = najie.装备.find(item => item.name == thing_name);
                for (var i = 0; i < najie.装备.length; i++) {//遍历列表有没有比那把强的
                    if (najie.装备[i].name == thing_name && najie.装备[i].pinji < equ.pinji) {
                        equ = najie.装备[i];
                    }
                }
                pj = equ.pinji;
                let pinji2 = ['劣', '普', '优', '精', '极', '绝', '顶']
                thing_piji = pinji2[pj]
            }
        }
        if (thing_amount < 1 || thing_amount == null || thing_amount == undefined || thing_amount == NaN) {
            thing_amount = 1;
        } else {
            thing_amount = thing_amount.replace(/[^0-9]/ig, "");
        }
        if (thing_amount < 1 || thing_amount == null || thing_amount == undefined || thing_amount == NaN) {
            thing_amount = 1;
        }
        let x = await exist_najie_thing(usr_qq, thing_name, thing_exist.class, pj);
        //判断戒指中是否存在
        if (!x) {
            //没有
            e.reply(`你没有[${thing_name}]这样的${thing_exist.class}`);
            return;
        }
        //判断戒指中的数量
        if (x < thing_amount) {
            //不够
            e.reply(`你目前只有[${thing_name}]*${x}`);
            return;
        }
        //数量够,数量减少,灵石增加
        await Add_najie_thing(usr_qq, thing_name, thing_exist.class, -thing_amount, pj);
        let commodities_price = thing_exist.出售价 * thing_amount;
        await Add_灵石(usr_qq, commodities_price);
        e.reply(`出售成功!  获得${commodities_price}灵石,还剩余${thing_name}*${x - thing_amount} `);
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
