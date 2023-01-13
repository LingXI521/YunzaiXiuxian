import plugin from '../../../../lib/plugins/plugin.js'
import config from "../../model/Config.js"
import data from '../../model/XiuxianData.js'
import fs from "fs"
import { segment } from "oicq"
import { timestampToTime, shijianc, get_random_fromARR, ForwardMsg, Getmsg_battle, get_random_talent, player_efficiency, Read_najie } from '../Xiuxian/xiuxian.js'
import { Add_灵石, Add_HP, Add_血气, Add_修为, Add_najie_thing, isNotNull, Read_player, __PATH, foundthing } from '../Xiuxian/xiuxian.js'
import path from "path"
import { existplayer } from "../Xiuxian/xiuxian.js";
import { exist_najie_thing, Read_equipment, Write_equipment, Write_player } from "../Xiuxian/xiuxian.js";


/**
 * 洞天福地
 */
export class TreasureCabinet extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'TreasureCabinet',
            /** 功能描述 */
            dsc: '宗门藏宝阁模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 9999,
            rule: [
                {
                    reg: '^#(宗门藏宝阁|藏宝阁)$',
                    fnc: 'List_treasureCabinet'
                },
                {
                    reg: '^#兑换.*$',
                    fnc: 'duihuan'
                },
                {
                    reg: '^#放入.*$',
                    fnc: 'fr'
                },
                {
                    reg: '^#收回.*$',
                    fnc: 'qh'
                },
                {
                    reg: '^#我的贡献$',
                    fnc: 'gonxian'
                },
                {
                    reg: '^#召唤神兽$',
                    fnc: 'Summon_Divine_Beast'
                },
                {
                    reg: '^#喂给神兽.*$',
                    fnc: 'Feed_Beast'
                },
                {
                    reg: '^#神兽赐福$',
                    fnc: 'Beast_Bonus'
                }
            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }


    //收回
    async qh(e) {
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
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        //职位不符
        if (player.宗门.职位 == "宗主") {
        } else {
            e.reply("只有宗主可以取回");
            return;
        }

        if (!isNotNull(player.level_id)) {
            e.reply("请先#同步信息");
            return;
        }
        let ass = data.getAssociation(player.宗门.宗门名称);
        //无字段
        if (!isNotNull(ass.藏宝阁)) {
            ass.藏宝阁 = []
            await data.setAssociation(ass.宗门名称, ass);
        }
        if (ass.宗门建设等级 < 10) {
            e.reply("藏宝阁尚未完工(建设等级至少10级哦)")
            return
        }
        let thingqq = e.msg.replace("#", '');
        thingqq = thingqq.replace("收回", '');
        let code = thingqq.split("\*");
        thingqq = code[0]
        let thing_pinji = code[1]//品级
        if (thingqq == "") {
            return;
        }

        //判断物品是否存在
        let pinji2 = ['劣', '普', '优', '精', '极', '绝', '顶']
        var x = 88888888888;
        for (var i = 0; i < ass.藏宝阁.length; i++) {
            //对比编号

            if (isNotNull(thing_pinji)) {


                if (ass.藏宝阁[i].name == thingqq && pinji2[ass.藏宝阁[i].pinji] == thing_pinji) {
                    x = i;
                    console.log(x)
                    break;

                }

            } else {
                if (ass.藏宝阁[i].name == thingqq) {
                    x = i;
                    break;
                }
            }
        }

        if (x == 88888888888) {
            e.reply("藏宝阁没有这种东西！")
            return
        }




        let thing_name = ass.藏宝阁[x].name
        let thing_class = ass.藏宝阁[x].class
        let thing_aconut = ass.藏宝阁[x].aconut
        if (thing_class == "装备") {
            // let pinji=['劣','普','优','精','极','绝','顶']
            let t = ass.藏宝阁[x].pinji
            // let pinji2=0
            // for(var z=0;pinji.length>z;z++){
            //     if(t==pinji[z]){
            //         pinji2=z
            //     }
            // }
            await Add_najie_thing(usr_qq, thing_name, thing_class, thing_aconut, t);
        } else {
            await Add_najie_thing(usr_qq, thing_name, thing_class, thing_aconut);
        }
        ass.藏宝阁.splice(x, 1)
        await data.setAssociation(ass.宗门名称, ass);
        e.reply("取回成功")
        return;
    }


    //放入
    async fr(e) {
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
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        //职位不符
        if (player.宗门.职位 == "宗主" || player.宗门.职位 == "副宗主") {
        } else {
            e.reply("只有宗主、副宗主可以放入");
            return;
        }

        let ass = data.getAssociation(player.宗门.宗门名称);
        //无字段
        if (!isNotNull(ass.藏宝阁)) {
            ass.藏宝阁 = []
            await data.setAssociation(ass.宗门名称, ass);
        }
        if (ass.宗门建设等级 < 10) {
            e.reply("藏宝阁尚未完工(建设等级至少10级哦)")
            return
        }
        let thing = e.msg.replace("#", '');
        thing = thing.replace("放入", '');
        let code = thing.split("\*");
        let thing_name = code[0];//物品
        let thing_value = code[1];//价格
        let thing_acunot = code[2];//数量
        let thing_pinji = code[3];//品级
        if (thing_acunot > 99) {
            e.reply("阁主:你想把藏宝阁淹了吗？")
            return;
        }
        if (thing_acunot < 1 || thing_acunot == null || thing_acunot == undefined || thing_acunot == NaN) {
            e.reply('休想卡bug');
            return;
        }
        if (thing_value <= 0) {
            return;
        }
        if (!isNaN(parseFloat(thing_value)) && isFinite(thing_value)) {
        } else {
            return;
        }
        if (!isNaN(parseFloat(thing_acunot)) && isFinite(thing_acunot)) {
        } else {
            return;
        }
        //判断列表中是否存在，不存在不能卖,并定位是什么物品
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`这方世界没有[${thing_name}]`);
            return;
        }

        //判断戒指中是否存在
        let thing_quantity = await exist_najie_thing(usr_qq, thing_name, thing_exist.class);
        if (!thing_quantity) {//没有
            e.reply(`你没有[${thing_name}]这样的${thing_exist.class}`);
            return;
        }
        let pinji = ['劣', '普', '优', '精', '极', '绝', '顶']
        let najie = await Read_najie(usr_qq)
        //判断戒指中的数量
        if (thing_exist.class == "装备") {
            let thing_pinji_number2 = findIndex(pinji, thing_pinji)
            let thing_quantity2 = najie.装备.find(item => item.name == thing_name && item.pinji == thing_pinji_number2).数量
            if (thing_quantity2 < thing_acunot) {//不够
                e.reply(`你目前只有[${thing_name}【${pinji[najie.装备.find(item => item.name == thing_name && item.pinji == thing_pinji_number2).pinji]}】]*${thing_quantity2}`);
                return;
            }
        } else {
            if (thing_quantity < thing_acunot) {//不够
                e.reply(`你目前只有[${thing_name}]*${thing_quantity}`);
                return;
            }
        }

        //修正数值非整数
        thing_value = Math.trunc(thing_value);//价格
        thing_acunot = Math.trunc(thing_acunot)//数量
        if (thing_exist.class == "装备") {

            if (!isNotNull(thing_pinji)) {
                e.reply("未输入品级")
                return
            }
            let thing_pinji_number = findIndex(pinji, thing_pinji)

            let pinji2 = najie.装备.find(item => item.name == thing_name && item.pinji == thing_pinji_number).pinji

            if (pinji[pinji2] != thing_pinji) {
                e.reply(`你没有[${thing_name}【${thing_pinji}】]这样的${thing_exist.class}`);
                return;
            }
            await Add_najie_thing(usr_qq, thing_name, thing_exist.class, -thing_acunot, pinji2);
        } else {
            await Add_najie_thing(usr_qq, thing_name, thing_exist.class, -thing_acunot);
        }



        //堆叠

        var x = 88888888888;
        for (var i = 0; i < ass.藏宝阁.length; i++) {
            //对比编号
            if (ass.藏宝阁[i].name == thing_name) {
                if (thing_exist.class == "装备") {
                    if (pinji[ass.藏宝阁[i].pinji] == thing_pinji) {//判断评级
                        x = i;
                        break;
                    }
                } else {
                    x = i;
                    break;
                }
            }
        }

        if (x == 88888888888) {
            if (thing_exist.class == "装备") {
                let ting = najie.装备.find(item => item.name == thing_name)
                let thing_pinji_number = findIndex(pinji, thing_pinji)
                let pinji2 = najie.装备.find(item => item.name == thing_name && item.pinji == thing_pinji_number).pinji


                var wupin = {
                    "name": thing_name,
                    "class": thing_exist.class,
                    "price": thing_value,
                    "aconut": thing_acunot,
                    "atk": ting.atk,
                    "def": ting.def,
                    "HP": ting.HP,
                    "bao": ting.bao,
                    "pinji": pinji2,
                };
            } else {
                var wupin = {
                    "name": thing_name,
                    "class": thing_exist.class,
                    "price": thing_value,
                    "aconut": thing_acunot,
                };
            }
            ass.藏宝阁.push(wupin);
            //写入
            await data.setAssociation(ass.宗门名称, ass);
            e.reply("放入成功！");
            return;
        } else {
            ass.藏宝阁[x].aconut += thing_acunot;
            e.reply("放入了" + thing_acunot + "个,当前数量为" + ass.藏宝阁[x].aconut);
            await data.setAssociation(ass.宗门名称, ass);
            return;
        }

    }




    //藏宝阁
    async List_treasureCabinet(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }

        let ass = data.getAssociation(player.宗门.宗门名称);
        //无字段
        if (!isNotNull(ass.藏宝阁)) {
            ass.藏宝阁 = []
            await data.setAssociation(ass.宗门名称, ass);
        }
        if (ass.宗门建设等级 < 10) {
            e.reply("藏宝阁尚未完工(建设等级至少10级哦)")
            return
        }
        //用户宗门的物品

        var yes = 0;
        let msg = await cangbaoge(ass.藏宝阁)
        await ForwardMsg(e, msg);

        return;
    }


    //兑换
    async duihuan(e) {
        //选购需要常用判断
        //固定写法
        let usr_qq = e.user_id;

        let player = await Read_player(usr_qq);
        if (!isNotNull(player.level_id)) {
            e.reply("请先#同步信息");
            return;
        }

        let ass = data.getAssociation(player.宗门.宗门名称);
        //无字段
        if (!isNotNull(ass.藏宝阁)) {
            ass.藏宝阁 = []
            await data.setAssociation(ass.宗门名称, ass);
        }
        if (ass.宗门建设等级 < 10) {
            e.reply("藏宝阁尚未完工(建设等级至少10级哦)")
            return
        }
        let thingqq = e.msg.replace("#", '');
        //拿到物品与数量
        thingqq = thingqq.replace("兑换", '');
        let code = thingqq.split("\*");
        let thing_acunot = code[1];//数量


        thingqq = code[0]
        let thing_pinji = code[2]
        if (thingqq == "") {
            return;
        }
        if (thing_acunot < 1 || thing_acunot == null || thing_acunot == undefined || thing_acunot == NaN) {
            thing_acunot = 1;
        }

        //根据物品的名称来购买

        let pinji2 = ['劣', '普', '优', '精', '极', '绝', '顶']
        var x = 88888888888;
        for (var i = 0; i < ass.藏宝阁.length; i++) {
            //对比编号

            if (isNotNull(thing_pinji)) {


                if (ass.藏宝阁[i].name == thingqq && pinji2[ass.藏宝阁[i].pinji] == thing_pinji) {
                    x = i;
                    console.log(x)
                    break;

                }

            }
            else {
                if (ass.藏宝阁[i].name == thingqq) {
                    x = i;
                    break;
                }
            }

        }

        if (x == 88888888888) {
            e.reply("藏宝阁没有这种东西！")
            return
        }
        if (ass.藏宝阁[x].aconut < thing_acunot) {
            e.reply("就这么点东西,还想要更多？");
            return;
        }
        //根名字得到物品
        let thing_name = ass.藏宝阁[x].name;
        let thing_class = ass.藏宝阁[x].class;
        let thing_whole = ass.藏宝阁[x].price * thing_acunot;
        console.log(x)
        //贡献值
        var gonxianzhi = Math.trunc(player.宗门.lingshi_donate / 10000)
        //查贡献
        if (gonxianzhi > thing_whole) {
            //加物品
            let msg = ""
            if (thing_class == "装备") {
                let t = ass.藏宝阁[x].pinji
                msg = "【" + pinji2[ass.藏宝阁[x].pinji] + "】"
                await Add_najie_thing(usr_qq, thing_name, thing_class, thing_acunot, t);
            } else {
                await Add_najie_thing(usr_qq, thing_name, thing_class, thing_acunot);
            }
            //扣贡献
            player.宗门.lingshi_donate = Math.trunc((gonxianzhi - thing_whole) * 10000)
            await Write_player(usr_qq, player);
            //判断数量
            if (ass.藏宝阁[x].aconut - thing_acunot > 0) {
                ass.藏宝阁[x].aconut -= thing_acunot;
                await data.setAssociation(ass.宗门名称, ass);
            } else {
                if (thing_class == "装备") {
                    //数量为0,删除该位置信息
                    console.log(x)
                    ass.藏宝阁.splice(x, 1)
                    await data.setAssociation(ass.宗门名称, ass);
                } else {
                    //数量为0,删除该位置信息
                    ass.藏宝阁.splice(x, 1)
                    await data.setAssociation(ass.宗门名称, ass);
                }
            }
            e.reply([`兑换成功!  获得[${thing_name}${msg}]x${thing_acunot},消耗了[${thing_whole}]贡献值,剩余[${gonxianzhi - thing_whole}]贡献值  `, '\n可以在【我的纳戒】中查看']);

        } else {
            e.reply("醒醒，你没有为宗门做那么多贡献！");
            return;
        }
        return;
    }

    //我的贡献
    async gonxian(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //用户不存在
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        if (!isNotNull(player.宗门.lingshi_donate)) {
            player.宗门.lingshi_donate = 0
        }
        if (0 > player.宗门.lingshi_donate) {
            player.宗门.lingshi_donate = 0
        }
        //贡献值为捐献灵石除10000
        var gonxianzhi = Math.trunc(player.宗门.lingshi_donate / 10000)
        e.reply("你为宗门的贡献值为[" + gonxianzhi + "],可以在#宗门藏宝阁 使用贡献值兑换宗门物品,感谢您对宗门做出的贡献")
    }



    async Summon_Divine_Beast(e) {
        //8级宗门，有驻地，灵石200w
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //用户不存在
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        //职位不符
        if (player.宗门.职位 == "宗主") {
        } else {
            e.reply("只有宗主可以操作");
            return;
        }

        let ass = data.getAssociation(player.宗门.宗门名称);
        if (ass.宗门等级 < 8) {
            e.reply(`宗门等级不足，尚不具备召唤神兽的资格`);
            return;
        }
        if (ass.宗门建设等级 < 50) {
            e.reply(`宗门建设等级不足,木头墙木头地板的不怕神兽把宗门拆了？`);
            return;
        }
        if (ass.宗门驻地 == 0) {
            e.reply(`驻地都没有，让神兽跟你流浪啊？`);
            return;
        }
        if (ass.灵石池 < 2000000) {
            e.reply(`宗门就这点钱，还想神兽跟着你干活？`);
            return;
        }
        if (ass.宗门神兽 != 0) {
            e.reply(`你的宗门已经有神兽了`);
            return;
        }
        //校验都通过了，可以召唤神兽了
        let random = Math.random();
        if (random > 0.92) {
            //给丹药,隐藏神兽,赐福时气血和修为都加,宗门驻地等级提高一级
            ass.宗门神兽 = "麒麟";
        } else if (random > 0.69) {
            //给功法，赐福加修为
            ass.宗门神兽 = "青龙";
        } else if (random > 0.46) {
            //给护具，赐福加气血
            ass.宗门神兽 = "玄武";
        } else if (random > 0.23) {
            //给法宝，赐福加修为
            ass.宗门神兽 = "朱雀";
        } else {
            //给武器 赐福加气血
            ass.宗门神兽 = "白虎";
        }

        ass.灵石池 -= 2000000;
        await data.setAssociation(ass.宗门名称, ass);
        e.reply(`召唤成功，神兽${ass.宗门神兽}投下一道分身，开始守护你的宗门，绑定神兽后不可更换哦`);
        return;
    }

    async Beast_Bonus(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //用户不存在
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        let ass = data.getAssociation(player.宗门.宗门名称);
        if (ass.宗门神兽 == 0) {
            e.reply("你的宗门还没有神兽的护佑，快去召唤神兽吧");
            return;
        }

        let now = new Date();
        let nowTime = now.getTime(); //获取当前日期的时间戳
        let Today = await shijianc(nowTime);
        let lastsign_time = await getLastsign_Bonus(usr_qq);//获得上次宗门签到日期
        if (Today.Y == lastsign_time.Y && Today.M == lastsign_time.M && Today.D == lastsign_time.D) {
            e.reply(`今日已经接受过神兽赐福了，明天再来吧`);
            return;
        }

        await redis.set("xiuxian:player:" + usr_qq + ":getLastsign_Bonus", nowTime);//redis设置签到时间

        let random = Math.random();
        let flag = 0.5;
        //根据好感度获取概率
        let i = 0
        let action = await redis.get("xiuxian:player:" + 10 + ":biguang");
        action = await JSON.parse(action);
        for (i = 0; i < action.length; i++) {
            if (action[i].qq == usr_qq) {
                if (action[i].beiyong2 > 0) {
                    action[i].beiyong2--

                }
                let up1 = action[i].beiyong3
                let flag = 0.7 - up1;
                if (player.favorability > 1000) {
                    flag = 0.1 - up1;
                } else if (player.favorability > 500) {
                    flag = 0.3 - up1;
                } else if (player.favorability > 200) {
                    flag = 0.5 - up1;
                }
                console.log(flag);

                if (action[i].beiyong2 == 0) {
                    action[i].beiyong3 = 0
                        ;
                }
                console.log(action[i])
            }
        }
        await redis.set("xiuxian:player:" + 10 + ":biguang", JSON.stringify(action))
        if (random > flag) {
            let randomA = Math.random();
            let res = 1;
            if (randomA > 0.85) {
                res = 1;
            } else if (randomA > 0.5) {
                res = 2;
            } else {
                res = 3;
            }

            let location = 0;
            let item_name = "";
            let item_class = "";
            let now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
            let body_level_id = data.Level_list.find(item => item.level_id == player.Physique_id).level_id;
            //获得奖励
            let randomB = Math.random();
            if (ass.宗门神兽 == "麒麟") {
                //给丹药,隐藏神兽,赐福时气血和修为都加,宗门驻地等级提高一级
                if (flag == 0.1 && res == 1 && randomB > 0.8) {
                    location = Math.floor(Math.random() * (data.qilin.length / res));
                    item_name = data.qilin[location].name;
                    item_class = data.qilin[location].class;
                } else {
                    location = Math.floor(Math.random() * (data.danyao_list.length / res));
                    item_name = data.danyao_list[location].name;
                    item_class = data.danyao_list[location].class;
                }
                await Add_血气(usr_qq, 500 * body_level_id);
                await Add_修为(usr_qq, 500 * now_level_id);
                await Add_HP(usr_qq, parseInt(player.血量上限));
                await Add_najie_thing(usr_qq, item_name, item_class, 1);
            } else if (ass.宗门神兽 == "青龙") {
                //给功法，赐福加修为
                if (flag == 0.1 && res == 1 && randomB > 0.8) {
                    location = Math.floor(Math.random() * (data.qinlong.length / res));
                    item_name = data.qinlong[location].name;
                    item_class = data.qinlong[location].class;
                } else {
                    location = Math.floor(Math.random() * (data.gongfa_list.length / res));
                    item_name = data.gongfa_list[location].name;
                    item_class = data.gongfa_list[location].class;
                }
                await Add_修为(usr_qq, 300 * now_level_id);
                await Add_HP(usr_qq, parseInt(player.血量上限));
                await Add_najie_thing(usr_qq, item_name, item_class, 1);

            } else if (ass.宗门神兽 == "玄武") {
                //给护具，赐福加气血
                if (flag == 0.1 && res == 1 && randomB > 0.8) {
                    location = Math.floor(Math.random() * (data.xuanwu.length / res));
                    item_name = data.xuanwu[location].name;
                    item_class = data.xuanwu[location].class;
                } else {
                    location = Math.floor(Math.random() * (data.huju_list.length / res));
                    item_name = data.huju_list[location].name;
                    item_class = data.huju_list[location].class;
                }
                await Add_血气(usr_qq, 300 * body_level_id);
                await Add_HP(usr_qq, parseInt(player.血量上限));
                await Add_najie_thing(usr_qq, item_name, item_class, 1);

            } else if (ass.宗门神兽 == "朱雀") {
                //给法宝，赐福加修为
                if (flag == 0.1 && res == 1 && randomB > 0.8) {
                    location = Math.floor(Math.random() * (data.xuanwu.length / res));
                    item_name = data.xuanwu[location].name;
                    item_class = data.xuanwu[location].class;
                } else {
                    location = Math.floor(Math.random() * (data.fabao_list.length / res));
                    item_name = data.fabao_list[location].name;
                    item_class = data.fabao_list[location].class;
                }
                await Add_修为(usr_qq, 300 * now_level_id);
                await Add_HP(usr_qq, parseInt(player.血量上限));
                await Add_najie_thing(usr_qq, item_name, item_class, 1);
            } else {
                //白虎给武器 赐福加气血
                if (flag == 0.1 && res == 1 && randomB > 0.8) {
                    location = Math.floor(Math.random() * (data.xuanwu.length / res));
                    item_name = data.xuanwu[location].name;
                    item_class = data.xuanwu[location].class;
                } else {
                    location = Math.floor(Math.random() * (data.wuqi_list.length / res));
                    item_name = data.wuqi_list[location].name;
                    item_class = data.wuqi_list[location].class;
                }
                await Add_血气(usr_qq, 300 * body_level_id);
                await Add_HP(usr_qq, parseInt(player.血量上限));
                await Add_najie_thing(usr_qq, item_name, item_class, 1);
            }
            if (flag == 0.1 && res == 1 && randomB > 0.8) {
                e.reply(`看见你来了,${ass.宗门神兽}很高兴，仔细挑选了${item_name}给你`);

            } else {
                e.reply(`${ass.宗门神兽}今天心情不错，随手丢给了你${item_name}`);
            }
            e.reply(`经过神兽的赐福，你的血量回满了，同时修为或气血得到了一定的提升`);
            return;
        } else {
            e.reply(`${ass.宗门神兽}闭上了眼睛，表示今天不想理你`);
            return;
        }
    }


    async Feed_Beast(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //用户不存在
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        let ass = data.getAssociation(player.宗门.宗门名称);
        if (ass.宗门神兽 == 0) {
            e.reply("你的宗门还没有神兽的护佑，快去召唤神兽吧");
            return;
        }

        let thing = e.msg.replace("#", '');
        thing = thing.replace("喂给神兽", '');
        let code = thing.split("\*");
        let thing_name = code[0];//物品
        let thing_value = code[1];//数量
        if (thing_value < 1 || thing_value == null || thing_value == undefined || thing_value == NaN) {
            e.reply('休想卡bug');
            return;
        }
        thing_value=Math.ceil(thing_value)

        //判断列表中是否存在，不存在不能卖,并定位是什么物品
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`神兽不吃这样的东西:${thing_name}`);
            return;
        }

        //纳戒中的数量
        let thing_quantity = await exist_najie_thing(usr_qq, thing_name, thing_exist.class);

        if (thing_quantity < thing_value || !thing_quantity) {//没有
            e.reply(`【${thing_name}】数量不足`);
            return;
        }

        var Time = 120;//2个小时
        let feedTimeout = parseInt(60000 * Time);

        //自己的cd
        let now_Time = new Date().getTime(); //获取当前时间戳
        let last_time = await redis.get("xiuxian:player:" + usr_qq + ":last_Feed_time");//获得上次的时间戳,
        last_time = parseInt(last_time);
        if (now_Time < last_time + feedTimeout) {
            let Couple_m = Math.trunc((last_time + feedTimeout - now_Time) / 60 / 1000);
            let Couple_s = Math.trunc(((last_time + feedTimeout - now_Time) % 60000) / 1000);
            e.reply(`喂养冷却:  ${Couple_m}分 ${Couple_s}秒`);
            return;
        }


        await redis.set("xiuxian:player:" + usr_qq + ":last_Feed_time", now_Time);
        //纳戒数量减少
        await Add_najie_thing(usr_qq, thing_name, thing_exist.class, -thing_value);

        player.favorability += Math.trunc(thing_exist.出售价 / 10000 * thing_value);
        await data.setData("player", usr_qq, player);

        e.reply(`喂养成功，你和神兽的亲密度增加了${Math.trunc(thing_exist.出售价 / 10000 * thing_value)},当前为${player.favorability}`);
        return;
    }


}

async function getLastsign_Bonus(usr_qq) {
    //查询redis中的人物动作
    let time = await redis.get("xiuxian:player:" + usr_qq + ":getLastsign_Bonus");
    if (time != null) {
        let data = await shijianc(parseInt(time))
        return data;
    }
    return false;
}



export async function cangbaoge(liebiao) {
    let msg = [
        "***" + "宗门藏宝阁" + "***"
    ];
    let v = 0
    let pinji = ['劣', '普', '优', '精', '极', '绝', '顶']
    for (var i = 0; i < liebiao.length; i++) {
        if (liebiao[i].class == "装备") {
            v += 1
            msg.push(liebiao[i].name + "【" + pinji[liebiao[i].pinji] + "】" + "\n" + "类型：" + liebiao[i].class + "\n" + "攻击力：" + liebiao[i].atk + "\n" + "防御：" + liebiao[i].def + "\n" + "血量：" + liebiao[i].HP + "\n" + "暴击加成：" + liebiao[i].bao * 100 + "%" + "\n" + "所需贡献值：" + liebiao[i].price + "\n余量:" + liebiao[i].aconut)
        } else {
            v += 1
            msg.push(liebiao[i].name + "\n" + "类型：" + liebiao[i].class + "\n" + "所需贡献值：" + liebiao[i].price + "\n余量:" + liebiao[i].aconut)
        }
    }
    if (v == 0) { msg.push("需要宗主放入物品！格式:\n#放入+物品名*所需贡献值*数量\n如果有是武器则需要加*品级") }
    return msg;
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

export async function Synchronization_ASS(e) {
    if (!e.isMaster) {
        return;
    }
    e.reply("宗门开始同步");
    let assList = [];
    let files = fs
        .readdirSync("./plugins/xiuxian-emulator-plugin/resources/data/association")
        .filter((file) => file.endsWith(".json"));
    for (let file of files) {
        file = file.replace(".json", "");
        assList.push(file);
    }
    for (let ass_name of assList) {


        let ass = await data.getAssociation(ass_name);
        let player = data.getData("player", ass.宗主);
        let now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
        //补
        if (!isNotNull(ass.power)) {
            ass.power = 0;
        }
        if (now_level_id < 42) {
            ass.power = 0; // 凡界
        } else {
            ass.power = 1;//  仙界
        }
        if (ass.power == 1) {
            if (ass.大阵血量 == 114514) {
                ass.大阵血量 = 1145140;
            }
            let level = ass.最低加入境界;
            if (level < 42) {
                ass.最低加入境界 = 42;
            }
        }
        if (ass.power == 0 && ass.最低加入境界 > 41) {
            ass.最低加入境界 = 41;
        }
        if (!isNotNull(ass.宗门驻地)) {
            ass.宗门驻地 = 0;
        }
        if (!isNotNull(ass.宗门建设等级)) {
            ass.宗门建设等级 = 0;
        }
        if (!isNotNull(ass.宗门神兽)) {
            ass.宗门神兽 = 0;
        }
        if (!isNotNull(ass.副宗主)) {
            ass.副宗主 = [];
        }
        await data.setAssociation(ass_name, ass);

    }

    e.reply("宗门同步结束");
    return;
}




