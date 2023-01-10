//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import fs from "fs"
import {segment} from "oicq"
import {
    Read_player,
    existplayer,
    exist_najie_thing,
    foundthing,
    Write_player,
    Locked_najie_thing
} from '../Xiuxian/xiuxian.js'
import {Add_灵石, Add_najie_thing} from '../Xiuxian/xiuxian.js'
import {__PATH} from "../Xiuxian/xiuxian.js"

/**
 * 全局变量
 */
let allaction = false;//全局状态判断
/**
 * 货币与物品操作模块
 */
export class MoneyOperation extends plugin {
    constructor() {
        super({
            name: 'MoneyOperation',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^赠送.*$',
                    fnc: 'Give'
                },
                {
                    reg: '^#发红包.*$',
                    fnc: 'Give_honbao'
                },
                {
                    reg: '^#抢红包$',
                    fnc: 'uer_honbao'
                },
                {
                    reg: '^#发福利.*$',
                    fnc: 'Allfuli'
                },
                {
                    reg: '^#发补偿.*$',
                    fnc: 'Fuli'
                },
                {
                    reg: '^#发(装备|道具|丹药|功法|草药|材料|盒子|仙宠|口粮|项链).*$',
                    fnc: 'wup'
                },
                {
                    reg: '^#扣除.*$',
                    fnc: 'Deduction'
                },
                {
                    reg: '^#打开钱包$',
                    fnc: 'openwallet'
                },
                {
                    reg: '#交税.*$',
                    fnc: 'MoneyWord'
                }
            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }

    async wup(e) {
        //主人
        if (!e.isMaster) {
            return;
        }
        //这是自己的
        let A_qq = e.user_id;
        //对方
        let isat = e.message.some((item) => item.type === "at");
        if (!isat) {
            return;
        }
        let atItem = e.message.filter((item) => item.type === "at");//获取at信息
        let B_qq = atItem[0].qq;//对方qq
        //检查存档
        let ifexistplay = await existplayer(B_qq);
        if (!ifexistplay) {
            e.reply("对方无存档");
            return;
        }
        //获取发送灵石数量
        let msg = e.msg.replace("#发", "");
        if (msg == "口粮") {
            msg = "仙宠口粮"
        }
        let thing_name_pinji_amount = msg.substr(2).split("*");
        let thing_name = thing_name_pinji_amount[0];
        let amount = 1;
        let pinji = null;
        if (thing_name_pinji_amount.length == 2) {
            amount = Number(thing_name_pinji_amount[1]);
        } else if (thing_name_pinji_amount.length == 3) {
            pinji = thing_name_pinji_amount[1];
            amount = Number(thing_name_pinji_amount[2]);
        }
        if (amount == NaN) {
            return;
        }
        //判断列表中是否存在，不存在不能卖,并定位是什么物品
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`这方世界没有[${thing_name}]`);
            return;
        }
        await Add_najie_thing(B_qq, thing_name, thing_exist.class, amount)
        e.reply("发放成功")
    }

    async MoneyWord(e) {
        if (!e.isGroup) {
            return;
        }
        //这是自己的
        let usr_qq = e.user_id;
        //自己没存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //全局状态判断
        await Go(e);
        if (allaction) {
            console.log(allaction);
        } else {
            return;
        }
        allaction = false;
        //获取发送灵石数量
        let lingshi = e.msg.replace("#", "");
        lingshi = lingshi.replace("交税", "");
        lingshi = Number(lingshi);
        if (!isNaN(parseFloat(lingshi)) && isFinite(lingshi)) {
        } else {
            return;
        }
        if (lingshi <= 0) {
            return;
        }
        lingshi = Math.trunc(lingshi);
        let player = await Read_player(usr_qq);
        if (player.灵石 <= lingshi) {
            e.reply("醒醒，你没有那么多");
            return;
        }
        await Add_灵石(usr_qq, -lingshi);
        let Worldmoney = await redis.get("Xiuxian:Worldmoney");
        Worldmoney = Number(Worldmoney);
        Worldmoney = Worldmoney + lingshi;
        Worldmoney = Number(Worldmoney);
        await redis.set("Xiuxian:Worldmoney", Worldmoney);
        e.reply("成功交税" + lingshi);
        return;
    }

    async Deduction(e) {
        if (!e.isGroup) {
            return;
        }
        if (!e.isMaster) {
            e.reply("你小子")
            return;
        }
        //对方
        let isat = e.message.some((item) => item.type === "at");
        if (!isat) {
            return;
        }
        let atItem = e.message.filter((item) => item.type === "at");//获取at信息
        let B_qq = atItem[0].qq;//对方qq
        //对方没存档
        let ifexistplay = await existplayer(B_qq);
        if (!ifexistplay) {
            e.reply(`此人尚未踏入仙途`);
            return;
        }
        //获取发送灵石数量
        let lingshi = e.msg.replace("#", "");
        lingshi = lingshi.replace("扣除", "");
        //校验输入灵石数
        if (parseInt(lingshi) == parseInt(lingshi) && parseInt(lingshi) >= 1000) {
            lingshi = parseInt(lingshi);
        } else {
            return;
        }
        await Add_灵石(B_qq, -lingshi);
        e.reply("已强行扣除灵石" + lingshi);
        let Worldmoney = await redis.get("Xiuxian:Worldmoney");
        Worldmoney = Number(Worldmoney);
        Worldmoney = Worldmoney + lingshi;
        Worldmoney = Number(Worldmoney);
        await redis.set("Xiuxian:Worldmoney", Worldmoney);
        return;
    }

    async Give(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        //这是自己的
        let A_qq = e.user_id;
        //自己没存档
        let ifexistplay = await existplayer(A_qq);
        if (!ifexistplay) {
            return;
        }
        //全局状态判断
        await Go(e);
        if (allaction) {
            console.log(allaction);
        } else {
            return;
        }
        allaction = false;
        //对方
        let isat = e.message.some((item) => item.type === "at");
        if (!isat) {
            return;
        }
        let atItem = e.message.filter((item) => item.type === "at");//获取at信息
        let B_qq = atItem[0].qq;//对方qq
        //对方没存档
        ifexistplay = await existplayer(B_qq);
        if (!ifexistplay) {
            e.reply(`此人尚未踏入仙途`);
            return;
        }
        let A_player = await data.getData("player", A_qq);
        // if (A_player.魔道值 > 100) {
        //     e.reply(`${A_player.名号}你一个大魔头还妄想出现在尘世？`);
        //     return;
        // }
        let B_player = await data.getData("player", B_qq);
        //获取发送灵石数量
        let msg = e.msg.replace("赠送", "");
        if (msg.startsWith("灵石")) {
            let lingshi = msg.replace("灵石", "");
            //校验输入灵石数
            if (parseInt(lingshi) == parseInt(lingshi) && parseInt(lingshi) >= 1000) {
                lingshi = parseInt(lingshi);
            } else {
                e.reply(`这么点灵石你也好拿得出手吗?起码要1000灵石,已为您修改`);
                lingshi = 1000;
            }
            //没有输入正确数字或＜1000;
            //检验A有没有那么多灵石
            var cost = this.xiuxianConfigData.percentage.cost;
            let lastlingshi = lingshi + Math.trunc(lingshi * cost);
            if (A_player.灵石 < lastlingshi) {
                e.reply([segment.at(A_qq), `你身上似乎没有${lastlingshi}灵石`]);
                return;
            }
            let now = new Date();
            let nowTime = now.getTime(); //获取当前时间戳
            let lastgetbung_time = await redis.get("xiuxian:player:" + A_qq + ":last_getbung_time");
            lastgetbung_time = parseInt(lastgetbung_time);
            let transferTimeout = parseInt(this.xiuxianConfigData.CD.transfer * 60000)
            if (nowTime < lastgetbung_time + transferTimeout) {
                let waittime_m = Math.trunc((lastgetbung_time + transferTimeout - nowTime) / 60 / 1000);
                let waittime_s = Math.trunc(((lastgetbung_time + transferTimeout - nowTime) % 60000) / 1000);
                e.reply(`每${transferTimeout / 1000 / 60}分钟赠送灵石一次，正在CD中，` + `剩余cd: ${waittime_m}分${waittime_s}秒`);
                return;
            }
            //交易
            await Add_灵石(A_qq, -lastlingshi);
            await Add_灵石(B_qq, lingshi);
            let Worldmoney = await redis.get("Xiuxian:Worldmoney");
            Worldmoney = Number(Worldmoney);
            Worldmoney = Worldmoney + lingshi * cost;
            Worldmoney = Number(Worldmoney);
            await redis.set("Xiuxian:Worldmoney", Worldmoney);
            e.reply([segment.at(A_qq), segment.at(B_qq), `${B_player.名号} 获得了由 ${A_player.名号}赠送的${lingshi}灵石`])
            //记录本次获得赠送灵石的时间戳
            await redis.set("xiuxian:player:" + A_qq + ":last_getbung_time", nowTime);
            return;
        } 
        else {
            let A_najie = await data.getData("najie", A_qq);
            let A_player = await data.getData("player", A_qq);
            // if (A_player.魔道值 > 100) {
            //     e.reply(`${A_player.名号}你一个大魔头还妄想出现在尘世？`);
            //     return;
            // }
            let thing_name_pinji_amount = msg.substr(0).split("*");
            let thing_name = thing_name_pinji_amount[0];
            let amount = 1;
            let pinji = null;
            if (thing_name_pinji_amount.length == 2) {
                amount = Number(thing_name_pinji_amount[1]);
            } else if (thing_name_pinji_amount.length == 3) {
                pinji = thing_name_pinji_amount[1];
                amount = Number(thing_name_pinji_amount[2]);
            }
            if (amount == NaN) {
                return;
            } else if (amount < 0) {
                e.reply(`你在想屁吃？`);
                return;
            }
            amount=Math.abs(Math.floor(amount));
            let thing_exist = await foundthing(thing_name);
            if (!thing_exist) {
            e.reply(`这方世界没有[${thing_name}]`);
            return;
            }
            let thing;
            let number=await exist_najie_thing(A_qq,thing_exist.name,thing_exist.class)
            if (thing_exist.class == "装备") {
                if (pinji != null) {
                    let pj = {
                        "劣": 0,
                        "普": 1,
                        "优": 2,
                        "精": 3,
                        "极": 4,
                        "绝": 5,
                        "顶": 6
                    }
                    pj = pj[pinji];
                    if (pinji == undefined) {
                        e.reply(`品级参数错误，请从劣/普/优/精/极/绝/顶中选择一个`);
                        return;
                    }
                    thing = A_najie.装备.find(item => item.name == thing_name && item.pinji == pj);
                } else {
                    thing = A_najie.装备.find(item => item.name == thing_name);
                }
            }
                if (thing==undefined &&thing_exist=="装备")
                {
                    e.reply(`你没有[${thing_name}](${pinji})`);
                    return;
                }
                if (await Locked_najie_thing(A_qq, thing_name, thing_exist.class) == 1) {
                    //锁定
                    e.reply(`你的纳戒中的${thing_exist.class}[${thing_name}]是锁定的`);
                    return;
                }
                if (number >= amount) {
                    if (thing_exist.class == "装备")
                    {
                        let pinji = thing.pinji;
                        await Add_najie_thing(A_qq, thing_name, thing_exist.class, -amount, pinji);
                        await Add_najie_thing(B_qq, thing_name, thing_exist.class, amount, pinji);
                    }
                    else
                    {
                        await Add_najie_thing(A_qq, thing_name, thing_exist.class, -amount);
                        await Add_najie_thing(B_qq, thing_name, thing_exist.class, amount);
                    }
                    e.reply([segment.at(A_qq), segment.at(B_qq), `${B_player.名号} 获得了由 ${A_player.名号}赠送的[${thing_name}]×${amount}`]);
                } else {
                    e.reply(`你还没有这么多[${thing_name}]`);
                
            }
            
        }
    }

    //发红包
    async Give_honbao(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        //这是自己的
        let usr_qq = e.user_id;
        //自己没存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //全局状态判断
        await Go(e);
        if (allaction) {
            console.log(allaction);
        } else {
            return;
        }
        allaction = false;
        //获取发送灵石数量
        let lingshi = e.msg.replace("#", "");
        lingshi = lingshi.replace("发红包", "");
        let code = lingshi.split("\*");
        lingshi = code[0];
        let acount = code[1];
        if (!isNaN(parseFloat(lingshi)) && isFinite(lingshi)) {
        } else {
            return;
        }
        if (!isNaN(parseFloat(acount)) && isFinite(acount)) {
            //是数字
        } else {
            return;
        }
        lingshi = Number(lingshi);
        acount = Number(acount);
        lingshi = Math.trunc(lingshi);
        acount = Math.trunc(acount);
        if (lingshi <= 0 || acount <= 0) {
            return;
        }
        let player = await data.getData("player", usr_qq);
        //对比自己的灵石，看看够不够！
        if (acount < 8) {
            e.reply("你好意思发这几个红包？看不起谁呢(已自动修改为八个)")
            acount = 8
        }
        if (player.灵石 <= parseInt(lingshi * acount)) {
            e.reply(`红包数要比自身灵石数小噢`);
            return;
        }
        let getlingshi = 0;
        //循环取整
        for (var i = 1; i <= 100; i++) {
            //校验输入灵石数
            if (parseInt(lingshi) == parseInt(lingshi) && parseInt(lingshi) == i * 10000) {
                //按万算，最高送一百万一个红包的灵石
                //符合调节就进来
                getlingshi = parseInt(lingshi);
                break;
            }
        }
        //取完之后查看灵石是否为零
        if (lingshi != getlingshi) {
            //不符合的，返回，并提示玩家
            e.reply(`一个红包最低为一万灵石噢，且是万的倍数，最高可发一百万一个`);
            return;
        }
        //减魔道值
        // if (lingshi * acount / 100000 < 1) {
        //     e.reply("善意过小没有得到天道原谅(太少不减魔道值)")
        // } else {
        //     player.魔道值 -= Math.floor(lingshi * acount / 100000)
        //     if (player.魔道值 < 0) player.魔道值 = 0;
        //     await Write_player(usr_qq, player)
        // }
        //发送的灵石要当到数据库里。大家都能取
        await redis.set("xiuxian:player:" + usr_qq + ":honbao", getlingshi);
        await redis.set("xiuxian:player:" + usr_qq + ":honbaoacount", acount);
        //然后扣灵石
        await Add_灵石(usr_qq, -getlingshi * acount);
        e.reply("【全服公告】" + player.名号 + "发了" + acount + "个" + getlingshi + "灵石的红包！");
        return;
    }

    //抢红包
    async uer_honbao(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //自己没存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = await data.getData("player", usr_qq);
        // if (player.魔道值 > 100) {
        //     e.reply(`${player.名号}你一个大魔头还妄想出现在尘世？`);
        //     return;
        // }
        //抢红包要有一分钟的CD
        let now_time = new Date().getTime();
        let lastgetbung_time = await redis.get("xiuxian:player:" + usr_qq + ":last_getbung_time");
        lastgetbung_time = parseInt(lastgetbung_time);
        let transferTimeout = parseInt(this.xiuxianConfigData.CD.honbao * 60000)
        if (now_time < lastgetbung_time + transferTimeout) {
            let waittime_m = Math.trunc((lastgetbung_time + transferTimeout - now_time) / 60 / 1000);
            let waittime_s = Math.trunc(((lastgetbung_time + transferTimeout - now_time) % 60000) / 1000);
            e.reply(`每${transferTimeout / 1000 / 60}分钟抢一次，正在CD中，` + `剩余cd: ${waittime_m}分${waittime_s}秒`);
            return;
        }
        //要艾特对方，表示抢对方红包
        let isat = e.message.some((item) => item.type === "at");
        if (!isat) {
            return;
        }
        let atItem = e.message.filter((item) => item.type === "at");
        let honbao_qq = atItem[0].qq;
        //有无存档
        let ifexistplay_honbao = await existplayer(honbao_qq);
        if (!ifexistplay_honbao) {
            return;
        }
        //这里有错
        var acount = await redis.get("xiuxian:player:" + honbao_qq + ":honbaoacount");
        acount = Number(acount);
        //根据个数判断
        if (acount <= 0) {
            e.reply("他的红包被光啦！");
            return;
        }
        //看看一个有多少灵石
        var lingshi = await redis.get("xiuxian:player:" + honbao_qq + ":honbao");
        var addlingshi = Math.trunc(lingshi);
        //减少个数
        acount--;
        await redis.set("xiuxian:player:" + honbao_qq + ":honbaoacount", acount);
        //拿出来的要给玩家
        await Add_灵石(usr_qq, addlingshi);
        //给个提示
        e.reply("【全服公告】" + player.名号 + "抢到一个" + addlingshi + "灵石的红包！");
        //记录时间
        await redis.set("xiuxian:player:" + usr_qq + ":last_getbung_time", now_time);
        return;
    }

    //发福利
    async Allfuli(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        if (!e.isMaster && e.user_id != 3196383818) {
            e.reply("你小子")
            return;
        }
        //获取发送灵石数量
        let lingshi = e.msg.replace("#发福利", "");
        var pattern = new RegExp("[0-9]+");
        var str = lingshi;
        if (!pattern.test(str)) {
            e.reply(`错误福利`);
            return;
        }
        //校验输入灵石数
        if (parseInt(lingshi) > 0) {
            lingshi = parseInt(lingshi);
        } else {
            lingshi = 100;//没有输入正确数字或不是正数
        }
        let File = fs.readdirSync(__PATH.player_path);
        File = File.filter(file => file.endsWith(".json"));
        let File_length = File.length;
        //金库
        let Worldmoney = 114514141414;
        if (Worldmoney == null || Worldmoney == undefined || Worldmoney <= 0 || Worldmoney == NaN) {
            Worldmoney = 1;
        }
        Worldmoney = Number(Worldmoney);
        if (Worldmoney <= lingshi * File_length) {
            e.reply("共有" + File_length + "名玩家，需要消耗" + lingshi * File_length + ",你的世界财富不足！");
            return;
        }
        Worldmoney = Worldmoney - lingshi * File_length;
        if (Worldmoney == null || Worldmoney == undefined || Worldmoney <= 0 || Worldmoney == NaN) {
            Worldmoney = 1;
        }
        Worldmoney = Number(Worldmoney);
        Math.trunc(Worldmoney);
        await redis.set("Xiuxian:Worldmoney", Worldmoney);
        for (var i = 0; i < File_length; i++) {
            let this_qq = File[i].replace(".json", '');
            await Add_灵石(this_qq, lingshi);
        }
        e.reply(`福利发放成功,目前共有${File_length}个玩家,每人增加${lingshi}灵石`);
        return;
    }

    //发补偿
    async Fuli(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        if (!e.isMaster && e.user_id != 3479823546) {
            e.reply("你小子")
            return;
        }
        //获取发送灵石数量
        let lingshi = e.msg.replace("#", "");
        lingshi = lingshi.replace("发", "");
        lingshi = lingshi.replace("补偿", "");
        var pattern = new RegExp("[0-9]+");
        var str = lingshi;
        if (!pattern.test(str)) {
            e.reply(`错误福利`);
            return;
        }
        //校验输入灵石数
        if (parseInt(lingshi) == parseInt(lingshi) && parseInt(lingshi) > 0) {
            lingshi = parseInt(lingshi);
        } else {
            lingshi = 100;//没有输入正确数字或不是正数
        }
        let isat = e.message.some((item) => item.type === "at");
        if (!isat) {
            return;
        }
        let atItem = e.message.filter((item) => item.type === "at");
        let this_qq = atItem[0].qq;
        //有无存档
        let ifexistplay = await existplayer(this_qq);
        if (!ifexistplay) {
            e.reply(`此人尚未踏入仙途`);
            return;
        }
        let Worldmoney = await redis.get("Xiuxian:Worldmoney");
        if (Worldmoney == null || Worldmoney == undefined || Worldmoney <= 0 || Worldmoney == NaN) {
            Worldmoney = 1;
        }
        Worldmoney = Number(Worldmoney);
        if (Worldmoney <= lingshi) {
            e.reply("世界财富不足！");
            return;
        }
        Worldmoney = Worldmoney - lingshi;
        if (Worldmoney == null || Worldmoney == undefined || Worldmoney <= 0 || Worldmoney == NaN) {
            Worldmoney = 1;
        }
        Worldmoney = Number(Worldmoney);
        await redis.set("Xiuxian:Worldmoney", Worldmoney);
        let player = await data.getData("player", this_qq);
        await Add_灵石(this_qq, lingshi);
        e.reply(`【全服公告】 ${player.名号} 获得${lingshi}灵石的补偿`);
        return;
    }

    async openwallet(e) {
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
        let player = await data.getData("player", usr_qq);
        let thing_name = "水脚脚的钱包"
        //x是纳戒内有的数量
        let acount = await exist_najie_thing(usr_qq, thing_name, "装备");
        //没有
        if (!acount) {
            e.reply(`你没有[${thing_name}]这样的装备`);
            return;
        }
        //扣掉装备
        await Add_najie_thing(usr_qq, thing_name, "装备", -1);
        //获得随机
        var x = 0.4;
        let random1 = Math.random();
        var y = 0.3;
        let random2 = Math.random();
        var z = 0.2
        let random3 = Math.random();
        var p = 0.1
        let random4 = Math.random();
        var m = "";
        var lingshi = 0;
        //查找秘境
        if (random1 < x) {
            if (random2 < y) {
                if (random3 < z) {
                    if (random4 < p) {
                        lingshi = 2000000;
                        m = player.名号 + "打开了[" + thing_name + "]金光一现！" + lingshi + "颗灵石！";
                    } else {
                        lingshi = 1000000;
                        m = player.名号 + "打开了[" + thing_name + "]金光一现!" + lingshi + "颗灵石！";
                    }
                } else {
                    lingshi = 400000;
                    m = player.名号 + "打开了[" + thing_name + "]你很开心的得到了" + lingshi + "颗灵石！";
                }
            } else {
                lingshi = 180000;
                m = player.名号 + "打开了[" + thing_name + "]你很开心的得到了" + lingshi + "颗灵石！";
            }
        } else {
            lingshi = 100000;
            m = player.名号 + "打开了[" + thing_name + "]你很开心的得到了" + lingshi + "颗灵石！";
        }
        await Add_灵石(usr_qq, lingshi);
        e.reply(m);
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
    let player = await Read_player(usr_qq);
    if (player.当前血量 < 200) {
        e.reply("你都伤成这样了,就不要出去浪了");
        return;
    }
    allaction = true;
    return;
}