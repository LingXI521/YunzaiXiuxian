//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import fs from "fs"
import { existplayer, Write_player, isNotNull, exist_najie_thing, Add_najie_thing, Add_职业经验, Add_灵石, sleep, ForwardMsg } from '../Xiuxian/xiuxian.js'
import { Read_player, __PATH } from '../Xiuxian/xiuxian.js'
import Show from "../../model/show.js"
import puppeteer from "../../../../lib/puppeteer/puppeteer.js"
import { segment } from "oicq"
import { zd_battle } from "../Battle/Battle.js"
/**
 * 全局变量
 */
/**
 * 境界模块
 */
let allaction = false;
export class Occupation extends plugin {
    constructor() {
        super({
            name: 'Yunzai_Bot_Occupation',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#转职.*$',
                    fnc: 'chose_occupation'
                },
                {
                    reg: '^#转换副职$',
                    fnc: 'chose_occupation2'
                },
                {
                    reg: '(^#采药$)|(^#采药(.*)(分|分钟)$)',
                    fnc: 'plant'
                },
                {
                    reg: '^#结束采药$',
                    fnc: 'plant_back'
                },
                {
                    reg: '(^#采矿$)|(^#采矿(.*)(分|分钟)$)',
                    fnc: 'mine'
                },
                {
                    reg: '^#结束采矿$',
                    fnc: 'mine_back'
                },
                {
                    reg: '^#丹药配方$',
                    fnc: 'show_danfang'
                },
                {
                    reg: '^#我的药效$',
                    fnc: 'yaoxiao',
                },
                {
                    reg: '^#装备图纸$',
                    fnc: 'show_tuzhi'
                },
                {
                    reg: '^#炼制.*(\\*[0-9]*)?$',
                    fnc: 'liandan'
                },
                {
                    reg: '^#打造.*(\\*[0-9]*)?$',
                    fnc: 'lianqi'
                },
                {
                    reg: '^#悬赏目标$',
                    fnc: 'search_sb'
                },
                {
                    reg: '^#讨伐目标.*$',
                    fnc: 'taofa_sb'
                },
                {
                    reg: '^#悬赏.*$',
                    fnc: 'xuanshang_sb'
                },
                {
                    reg: '^#赏金榜$',
                    fnc: 'shangjingbang'
                },
                {
                    reg: '^#刺杀目标.*$',
                    fnc: 'cisha_sb'
                },
                {
                    reg: '(^#狩猎$)|(^#狩猎(.*)(分|分钟)$)',
                    fnc: 'shoulie'
                },
                {
                    reg: '^#结束狩猎$',
                    fnc: 'shoulie_back'
                }
            ]
        });
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }

    async chose_occupation(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        await Go(e);
        if (!allaction) {
            return;
        }
        allaction=false;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
         
        let occupation = e.msg.replace("#转职", "");
        let player = await Read_player(usr_qq);
        let player_occupation = player.occupation;
        let x = data.occupation_list.find(item => item.name == occupation);
        if (!isNotNull(x)) {
            e.reply(`没有[${occupation}]这项职业`);
            return;
        }
        let now_level_id
        now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
        if (now_level_id < 17 && occupation == "采矿师") {
            e.reply("包工头:就你这小身板还来挖矿？再去修炼几年吧")
            return
        }
        if (now_level_id < 25 && occupation == "猎户") {
            e.reply("就你这点修为做猎户？怕不是光头强砍不到树来转的？")
            return
        }
        let thing_name = occupation + "转职凭证"
        console.log(thing_name)
        let thing_class = "道具"
        let n = -1
        let thing_quantity = await exist_najie_thing(usr_qq, thing_name, thing_class);
        if (!thing_quantity) {//没有
            e.reply(`你没有【${thing_name}】`);
            return;
        }
        if (player_occupation == occupation) {
            e.reply(`你已经是[${player_occupation}]了，可使用[职业转化凭证]重新转职`);
            return;
        }
        await Add_najie_thing(usr_qq, thing_name, thing_class, n);
        if (player.occupation.length == 0) {
            player.occupation = occupation;
            player.occupation_level = 1;
            player.occupation_exp = 0;
            await Write_player(usr_qq, player);
            e.reply(`恭喜${player.名号}转职为[${occupation}]`);
            return;
        }
        let action = await redis.get("xiuxian:player:" + usr_qq + ":fuzhi");//副职
        action = await JSON.parse(action);
        if (action == null) {
            action = [];
        }
        var arr = {
            职业名: player.occupation,
            职业经验: player.occupation_exp,
            职业等级: player.occupation_level,
        }
        action = arr;
        await redis.set("xiuxian:player:" + usr_qq + ":fuzhi", JSON.stringify(action));
        player.occupation = occupation;
        player.occupation_level = 1;
        player.occupation_exp = 0;
        await Write_player(usr_qq, player);
        console.log(action);
        e.reply(`恭喜${player.名号}转职为[${occupation}],您的副职为${arr.职业名}`);
        return;

    }
    async chose_occupation2(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
         await Go(e);
        if (!allaction) {
            return;
        }
        allaction=false;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
         
        let player = await Read_player(usr_qq);
        let action = await redis.get("xiuxian:player:" + usr_qq + ":fuzhi");//副职
        action = await JSON.parse(action);
        if (action == null) {
            action = [];
            e.reply(`您还没有副职哦`);
            return;
        }
        let a, b, c;
        a = action.职业名;
        b = action.职业经验;
        c = action.职业等级;
        action.职业名 = player.occupation;
        action.职业经验 = player.occupation_exp;
        action.职业等级 = player.occupation_level;
        player.occupation = a;
        player.occupation_exp = b;
        player.occupation_level = c;
        await redis.set("xiuxian:player:" + usr_qq + ":fuzhi", JSON.stringify(action));
        console.log(action);
        await Write_player(usr_qq, player);
        e.reply(`恭喜${player.名号}转职为[${player.occupation}],您的副职为${action.职业名}`);
        return;
    }

    async plant(e) {
        let usr_qq = e.user_id;//用户qq
        //有无存档
        if (!await existplayer(usr_qq)) {
            return;
        }
        //不开放私聊
        if (!e.isGroup) {
            return;
        }
        //获取游戏状态
        let game_action = await redis.get("xiuxian:player:" + usr_qq + ":game_action");
        //防止继续其他娱乐行为
        if (game_action == 0) {
            e.reply("修仙：游戏进行中...");
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.occupation != "采药师") {
            e.reply("您采药，您配吗?")
            return
        }
        //获取时间
        let time = e.msg.replace("#采药", "");
        time = time.replace("分钟", "");
        if (parseInt(time) == parseInt(time)) {
            time = parseInt(time);
            var y = 15;//时间
            var x = 48;//循环次数
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<30，修正。
            if (time < 30) {
                time = 30;
            }
        }
        else {
            //不设置时间默认30分钟
            time = 30;
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
                e.reply("正在" + action.action + "中，剩余时间:" + m + "分" + s + "秒");
                return;
            }
        }

        let action_time = time * 60 * 1000;//持续时间，单位毫秒
        let arr = {
            "action": "采药",//动作
            "end_time": new Date().getTime() + action_time,//结束时间
            "time": action_time,//持续时间
            "plant": "0",//采药-开启
            "shutup": "1",//闭关状态-开启
            "working": "1",//降妖状态-关闭
            "Place_action": "1",//秘境状态---关闭
            "Place_actionplus": "1",//沉迷---关闭
            "power_up": "1",//渡劫状态--关闭
            "mojie": "1",//魔界状态---关闭
            "xijie": "1", //洗劫状态开启
            "mine": "1",//采矿-开启

        };
        if (e.isGroup) {
            arr.group_id = e.group_id
        }

        await redis.set("xiuxian:player:" + usr_qq + ":action", JSON.stringify(arr));//redis设置动作
        e.reply(`现在开始采药${time}分钟`);

        return true;
    }



    async plant_back(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let action = await this.getPlayerAction(e.user_id);
        let state = await this.getPlayerState(action);
        if (state == "空闲") {
            return;
        }
        if (action.action != "采药") {
            return;
        }
        //结算
        let end_time = action.end_time;
        let start_time = action.end_time - action.time;
        let now_time = new Date().getTime();
        let time;
        var y = 15;//固定时间
        var x = 48;//循环次数

        if (end_time > now_time) {//属于提前结束
            time = parseInt((new Date().getTime() - start_time) / 1000 / 60);
            //超过就按最低的算，即为满足30分钟才结算一次
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<15，不给收益
            if (time < y) {
                time = 0;
            }
        } else {//属于结束了未结算
            time = parseInt((action.time) / 1000 / 60);
            //超过就按最低的算，即为满足30分钟才结算一次
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<15，不给收益
            if (time < y) {
                time = 0;
            }
        }
        if (e.isGroup) {
            await this.plant_jiesuan(e.user_id, time, false, e.group_id);//提前闭关结束不会触发随机事件
        } else {
            await this.plant_jiesuan(e.user_id, time, false);//提前闭关结束不会触发随机事件
        }
        let arr = action;
        arr.is_jiesuan = 1;//结算状态
        arr.plant = 1;//采药状态
        arr.shutup = 1;//闭关状态
        arr.working = 1;//降妖状态
        arr.power_up = 1;//渡劫状态
        arr.Place_action = 1;//秘境
        //结束的时间也修改为当前时间
        arr.end_time = new Date().getTime();
        delete arr.group_id;//结算完去除group_id
        await redis.set("xiuxian:player:" + e.user_id + ":action", JSON.stringify(arr));
    }
    async mine(e) {
        let usr_qq = e.user_id;//用户qq
        //有无存档
        if (!await existplayer(usr_qq)) {
            return;
        }
        //不开放私聊
        if (!e.isGroup) {
            return;
        }
        //获取游戏状态
        let game_action = await redis.get("xiuxian:player:" + usr_qq + ":game_action");
        //防止继续其他娱乐行为
        if (game_action == 0) {
            e.reply("修仙：游戏进行中...");
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.occupation != "采矿师") {
            e.reply("你挖矿许可证呢？非法挖矿，罚款200灵石")
            await Add_灵石(usr_qq, -200)
            return
        }
        //获取时间
        let time = e.msg.replace("#采矿", "");
        time = time.replace("分钟", "");
        if (parseInt(time) == parseInt(time)) {
            time = parseInt(time);
            var y = 30;//时间
            var x = 24;//循环次数
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<30，修正。
            if (time < 30) {
                time = 30;
            }
        }
        else {
            //不设置时间默认30分钟
            time = 30;
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
                e.reply("正在" + action.action + "中，剩余时间:" + m + "分" + s + "秒");
                return;
            }
        }

        let action_time = time * 60 * 1000;//持续时间，单位毫秒
        let arr = {
            "action": "采矿",//动作
            "end_time": new Date().getTime() + action_time,//结束时间
            "time": action_time,//持续时间
            "plant": "1",//采药-开启
            "mine": "0",//采药-开启
            "shutup": "1",//闭关状态-开启
            "working": "1",//降妖状态-关闭
            "Place_action": "1",//秘境状态---关闭
            "Place_actionplus": "1",//沉迷---关闭
            "power_up": "1",//渡劫状态--关闭
            "mojie": "1",//魔界状态---关闭
            "xijie": "1", //洗劫状态开启
        };
        if (e.isGroup) {
            arr.group_id = e.group_id
        }

        await redis.set("xiuxian:player:" + usr_qq + ":action", JSON.stringify(arr));//redis设置动作
        e.reply(`现在开始采矿${time}分钟`);

        return true;
    }



    async mine_back(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let action = await this.getPlayerAction(e.user_id);
        let state = await this.getPlayerState(action);
        if (state == "空闲") {
            return;
        }
        if (action.action != "采矿") {
            return;
        }
        //结算
        let end_time = action.end_time;
        let start_time = action.end_time - action.time;
        let now_time = new Date().getTime();
        let time;
        var y = this.xiuxianConfigData.mine.time;//固定时间
        var x = this.xiuxianConfigData.mine.cycle;//循环次数
        if (end_time > now_time) {//属于提前结束
            time = parseInt((new Date().getTime() - start_time) / 1000 / 60);
            //超过就按最低的算，即为满足30分钟才结算一次
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<15，不给收益
            if (time < y) {
                time = 0;
            }
        } else {//属于结束了未结算
            time = parseInt((action.time) / 1000 / 60);
            //超过就按最低的算，即为满足30分钟才结算一次
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<15，不给收益
            if (time < y) {
                time = 0;
            }
        }

        if (e.isGroup) {
            await this.mine_jiesuan(e.user_id, time, false, e.group_id);//提前闭关结束不会触发随机事件
        } else {
            await this.mine_jiesuan(e.user_id, time, false);//提前闭关结束不会触发随机事件
        }

        let arr = action;
        arr.is_jiesuan = 1;//结算状态
        arr.mine = 1;//采药状态
        arr.plant = 1;//采药状态
        arr.shutup = 1;//闭关状态
        arr.working = 1;//降妖状态
        arr.power_up = 1;//渡劫状态
        arr.Place_action = 1;//秘境
        //结束的时间也修改为当前时间
        arr.end_time = new Date().getTime();
        delete arr.group_id;//结算完去除group_id
        await redis.set("xiuxian:player:" + e.user_id + ":action", JSON.stringify(arr));
    }


    async plant_jiesuan(user_id, time, is_random, group_id) {

        let usr_qq = user_id;
        let player = data.getData("player", usr_qq);
        let now_level_id;

        if (!isNotNull(player.level_id)) {
            return;
        }
        let msg = [segment.at(usr_qq)];
        // var size = this.xiuxianConfigData.plant.size;
        //let plant_amount1 = Math.floor((0.07+Math.random()*0.04)*time);
        //let plant_amount2 = Math.floor((0.07+Math.random()*0.04)*time);
        //let plant_amount3 = Math.floor((0.07+Math.random()*0.04)*time);
        //let plant_amount4 = Math.floor((0.07+Math.random()*0.04)*time);
        let exp = 0;
        let ext = "";
        let rate = 0;
        if (player.occupation == "采药师") {
            exp = time * 10;
            rate = data.occupation_exp_list.find(item => item.id == player.occupation_level).rate * 10;
            ext = `你是采药师，获得采药经验${exp}，额外获得药材${Math.floor(rate * 100)}%，`;
        }
        //plant_amount1 = parseInt(plant_amount1 * time);
        //plant_amount2 = parseInt(plant_amount2 * time);
        //plant_amount3 = parseInt(plant_amount3 * time);
        //plant_amount4 = parseInt(plant_amount4 * time);
        /*凝血草 甜甜花 何首乌 清心草 血精草*/
        let res = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ]
        let names = ["凝血草", "甜甜花", "何首乌", "清心草", "血精草"];
        let years = ["一年", "十年", "百年", "千年", "万年"];
        if (player.level_id <= 21) {
            time = time * player.level_id / 40
            msg.push("由于你境界不足化神,在琥牢山爬上爬下总被石珀困住，挣脱花了很多时间，收入降低" + (1 - player.level_id / 40) * 50 + "%\n")
        } else {
            time = time * player.level_id / 40
        }

        while (time > 0) {
            let plant_year = Math.random();
            if (plant_year < 0.001 * (1 + rate)) {
                plant_year = 4;
            }
            else if (plant_year < 0.01 * (1 + rate)) {
                plant_year = 3;
            }
            else if (plant_year < 0.05 * (1 + rate)) {
                plant_year = 2;
            }
            else if (plant_year < 0.5 * (1 + rate)) {
                plant_year = 1;
            }
            else {
                plant_year = 0;
            }
            time -= 1;
            res[plant_year][Math.floor(Math.random() * 5)] += 1;//数量=1到4随机数
        }
        let res_msg = "";
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (res[i][j] > 0) {
                    res_msg += `\n[${years[i]}${names[j]}]×${res[i][j]}，`;
                }
                await Add_najie_thing(usr_qq, years[i] + names[j], "草药", res[i][j]);
            }
        }
        await Add_职业经验(usr_qq, exp);
        msg.push(`\n采药归来，${ext}${res_msg}`);
        //msg.push(`\n采药归来，${ext}收获人参×${plant_amount1}，何首乌×${plant_amount2}，当归×${plant_amount3}，枸杞×${plant_amount4}`);



        if (group_id) {
            await this.pushInfo(group_id, true, msg)
        } else {
            await this.pushInfo(usr_qq, false, msg);
        }

        return;
    }

    async mine_jiesuan(user_id, time, is_random, group_id) {

        let usr_qq = user_id;
        let player = data.getData("player", usr_qq);
        let now_level_id;

        if (!isNotNull(player.level_id)) {
            return;
        }
        let msg = [segment.at(usr_qq)];
        var size = this.xiuxianConfigData.mine.size;
        let mine_amount1 = Math.floor((1.8 + Math.random() * 0.4) * time);
        let mine_amount2 = Math.floor((1.8 + Math.random() * 0.4) * time);
        let mine_amount3 = Math.floor(time / 30);
        let mine_amount4 = Math.floor(time / 30);
        let mine_amount5 = Math.floor(time / 30);
        let rate = data.occupation_exp_list.find(item => item.id == player.occupation_level).rate * 10;
        let exp = 0;
        let ext = "";
        if (player.occupation == "采矿师") {
            exp = time * 10;
            time *= rate;
            ext = `你是采矿师，获得采矿经验${exp}，额外获得矿石${Math.floor(rate * 100)}%，`;
        }

        let end_amount = Math.floor(4 * (rate + 1) * (mine_amount1))//普通矿石
        let end_amount2 = Math.floor(4 * (rate + 1) * (mine_amount3))//稀有
        if (player.level_id <= 21) {

            end_amount *= player.level_id / 40
            end_amount2 *= player.level_id / 40
            msg.push("由于你境界不足化神,在琥牢山爬上爬下总被石珀困住，挣脱花了很多时间，收入降低" + (1 - player.level_id / 40) * 50 + "%\n")
        } else {
            end_amount *= player.level_id / 40
            end_amount2 *= player.level_id / 40
        }


        //mine_amount1 = parseInt(mine_amount1 * time);
        //mine_amount2 = parseInt(mine_amount2 * time);
        //mine_amount3 = parseInt(mine_amount3 * time);
        //mine_amount4 = parseInt(mine_amount4 * time);
        end_amount = Math.floor(end_amount);
        end_amount2 = Math.floor(end_amount2);
        await Add_najie_thing(usr_qq, "庚金", "材料", end_amount);
        await Add_najie_thing(usr_qq, "玄土", "材料", end_amount);
        await Add_najie_thing(usr_qq, "红宝石", "材料", end_amount2);
        await Add_najie_thing(usr_qq, "绿宝石", "材料", end_amount2);
        await Add_najie_thing(usr_qq, "蓝宝石", "材料", end_amount2);
        await Add_职业经验(usr_qq, exp);
        msg.push(`\n采矿归来，${ext}\n收获庚金×${end_amount}\n玄土×${end_amount}\n红宝石×${end_amount2}\n绿宝石×${end_amount2}\n蓝宝石×${end_amount2}`);



        if (group_id) {
            await this.pushInfo(group_id, true, msg)
        } else {
            await this.pushInfo(usr_qq, false, msg);
        }

        return;
    }

    async show_danfang(e) {
        if (!e.isGroup) {
            return;
        }
        let img = await get_danfang_img(e);
        e.reply(img);
        return;
    }
    async yaoxiao(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let action = await redis.get('xiuxian:player:' + 10 + ':biguang');
        action = await JSON.parse(action);
        let usr_qq = e.user_id;
        let i = 0;
        let m = '丹药效果:';
        for (i = 0; i < action.length; i++) {
            if (action[i].qq == usr_qq) {
                if (action[i].ped > 0) {
                    m += `\n仙缘丹药力${action[i].beiyong1 * 100}%药效${action[i].ped}次`;
                }
                if (action[i].lianti > 0) {
                    m += `\n炼神丹药力${action[i].beiyong4 * 100}%药效${
                        action[i].lianti
                        }次`;
                }
                if (action[i].beiyong2 > 0) {
                    m += `\n神赐丹药力${action[i].beiyong3 * 100}% 药效${
                        action[i].beiyong2
                        }次`;
                }
                if (action[i].biguan > 0) {
                    m += `\n辟谷丹药力${action[i].biguanxl * 100}%药效${
                        action[i].biguan
                        }次`;
                }
                let player = await data.getData('player', usr_qq);
                if (player.islucky > 0) {
                    m += `\n福源丹药力${player.addluckyNo * 100}%药效${player.islucky}次`;
                }
                if (player.breakthrough == true) {
                    m += `\n破境丹生效中`;
                }
                e.reply(m);
            }
        }
        let player = await data.getData('player', usr_qq);
        if (player.islucky > 0) {
            m += `\n福源丹药力${player.addluckyNo * 100}%药效${player.islucky}次`;
        }
        if (player.breakthrough == true) {
            m += `\n破境丹生效中`;
        }
        return;
    }

    async show_tuzhi(e) {
        if (!e.isGroup) {
            return;
        }
        let img = await get_tuzhi_img(e);
        e.reply(img);
        return;
    }


    async liandan(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.occupation != "炼丹师") {
            e.reply("丹是上午炼的,药是中午吃的,人是下午走的")
            return
        }
        let t = e.msg.replace("#炼制", "").split("*");
        if (t <= 0) {
            t = 1
        }
        let danyao = t[0];
        let n = 1;
        if (t.length > 1) {
            n = Number(t[1]);
            n = Math.abs(Math.trunc(n));
        }
        let suc_rate = 0;
        let m = 0;
        let tmp_msg = "";
        let danfang = data.danfang_list.find(item => item.name == danyao);
        if (!isNotNull(danfang)) {
            e.reply(`世界上没有丹药[${danyao}]的配方`);
            return;
        }
        if (danfang.level_limit > player.occupation_level) {
            e.reply(`${danfang.level_limit}级炼丹师才能炼制${danyao}`);
            return;
        }
        let materials = danfang.materials;
        let exp = danfang.exp;

        let danfang_rate = danfang.rate;
        let zhiye_rate = data.occupation_exp_list.find(item => item.id == player.occupation_level).rate;
        suc_rate += danfang_rate;
        //控制最高阶炼丹师能够99%炼制成功最高阶丹药。
        suc_rate += zhiye_rate * 0.13;

        m = 1;
        tmp_msg += "消耗";
        for (let i in materials) {
            let material = materials[i];
            let x = await exist_najie_thing(usr_qq, material.name, "草药");
            if (x == false) {
                x = 0;
            }
            if (x < material.amount * n) {
                e.reply(`纳戒中拥有${material.name}${x}份，炼制需要${material.amount * n}份`);
                return;
            }
        }
        for (let i in materials) {
            let material = materials[i];
            tmp_msg += `${material.name}×${material.amount * n}，`;
            await Add_najie_thing(usr_qq, material.name, "草药", -material.amount * n);
        }
        let res_n = 0;
        let total_exp = 0;
        for (let i = 0; i < n; i++) {
            let rand = Math.random();
            if (rand <= suc_rate) {
                res_n++;
                total_exp += exp[1];
            } else {
                total_exp += exp[0];
            }
        }
        let lose = n - res_n
        if (player.仙宠.type == "炼丹") {
            let random = Math.random()
            if (random < player.仙宠.加成) {
                res_n *= 2
                e.reply("你的仙宠" + player.仙宠.name + "辅佐了你进行炼丹,成功获得了双倍丹药")
            } else {
                e.reply("你的仙宠只是在旁边看着")
            }
        }
        if (danyao == "神心丹" || danyao == "九阶淬体丹" || danyao == "九阶玄元丹" || danyao == "破境丹") {
            await Add_najie_thing(usr_qq, danyao, "丹药", res_n);
            e.reply(`${tmp_msg}炼制失败${lose}次，得到${danyao}${res_n}颗，获得炼丹经验${total_exp * m}`);
        } else {
            let dengjixiuzheng = player.occupation_level
            let newrandom = Math.random()
            let newrandom2 = Math.random()
            if (newrandom >= 0.1 + dengjixiuzheng * 3 / 100) {
                await Add_najie_thing(usr_qq, "凡品" + danyao, "丹药", res_n);
                e.reply(`${tmp_msg}炼制失败${lose}次，得到"凡品"${danyao}${res_n}颗，获得炼丹经验${total_exp * m}`);
            } else {
                if (newrandom2 >= 0.4) {
                    await Add_najie_thing(usr_qq, "极品" + danyao, "丹药", res_n);
                    e.reply(`${tmp_msg}炼制失败${lose}次，得到"极品"${danyao}${res_n}颗，获得炼丹经验${total_exp * m}`);
                } else {
                    await Add_najie_thing(usr_qq, "仙品" + danyao, "丹药", res_n);
                    e.reply(`${tmp_msg}炼制失败${lose}次，得到"仙品"${danyao}${res_n}颗，获得炼丹经验${total_exp * m}`);
                }
            }
        }
        await Add_职业经验(usr_qq, total_exp * m);
    }



    async lianqi(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.occupation != "炼器师") {
            e.reply("铜都不炼你还炼器？")
            return
        }
        let t = e.msg.replace("#打造", "").split("*");
        let equipment_name = t[0];
        let n = 1;
        if (t.length > 1) {
            e.reply(`一次只能打造一件装备`);
        }

        let suc_rate = 0;
        let m = 0;
        let tmp_msg1 = "";
        let tmp_msg2 = "";
        let tuzhi = data.tuzhi_list.find(item => item.name == equipment_name);
        if (!isNotNull(tuzhi)) {
            e.reply(`世界上没有[${equipment_name}]的图纸`);
            return;
        }
        let materials = tuzhi.materials;
        let exp = tuzhi.exp;
        let res_exp = 0;
        suc_rate += tuzhi.rate;

        let rate = 0;

        if (player.occupation_level > 0) {
            rate = data.occupation_exp_list.find(item => item.id == player.occupation_level).rate;
            rate = rate * 10
            rate = rate * 0.025
        }
        if (player.occupation == "炼器师") {
            tmp_msg1 += `你是炼器师，额外增加成功率${Math.floor(rate * 10)}%(以乘法算)，`;
            suc_rate *= 1 + rate;
            if (player.occupation_level >= 24) { suc_rate = 0.8 }
            m = 1;
            let e = 0;
            if (Math.random() < 0.1) {
                tmp_msg2 += `，得到了炼器之神的眷顾，本次炼器经验翻倍`;
                e++;
            }
            res_exp = exp[e];
            tmp_msg2 += `，获得炼器经验${res_exp}`
        }
        tmp_msg1 += "消耗";
        for (let i in materials) {
            let material = materials[i];
            let x = await exist_najie_thing(usr_qq, material.name, "材料");
            if (x == false) {
                x = 0;
            }
            if (x < material.amount) {
                e.reply(`纳戒中拥有${material.name}×${x}，打造需要${material.amount}份`);
                return;
            }
        }
        for (let i in materials) {
            let material = materials[i];
            tmp_msg1 += `${material.name}×${material.amount}，`;
            await Add_najie_thing(usr_qq, material.name, "材料", -material.amount);
        }
        let rand1 = Math.random();
        if (rand1 > suc_rate) {
            let random = Math.random()
            if (random < 0.5) {
                e.reply(`打造装备时不小心锤断了刃芯，打造失败！`);
            } else {
                e.reply(`打造装备时没有把控好火候，烧毁了，打造失败！`);
            }
            return;
        }
        let pinji = 0;
        for (let i = 0; i < 6; i++) {
            if (Math.random() < 0.4 * (1 + rate)) {
                pinji++;
            }
            else {
                break;
            }
        }
        if (pinji > 5) {
            e.reply("在你细致的把控下，一把绝世极品即将问世！！！！")
            await sleep(10000)
        }
        await Add_najie_thing(usr_qq, equipment_name, "装备", 1, pinji);
        await Add_职业经验(usr_qq, res_exp * m);
        await e.reply(`${tmp_msg1}打造成功，获得${equipment_name}(${['劣', '普', '优', '精', '极', '绝', '顶'][pinji]})×1${tmp_msg2}`);
    }
    async search_sb(e) {
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.occupation != "侠客") {
            e.reply("只有专业的侠客才能获取悬赏")
            return
        }
        let msg = [];
        let action = await redis.get("xiuxian:player:" + usr_qq + ":shangjing");
        action = await JSON.parse(action);
        let type = 0;
        if (action != null) {
            if (action.end_time > new Date().getTime()) {
                msg = action.arm;
                var msg_data = {
                    msg,
                    type
                }
                const data1 = await new Show(e).get_msg(msg_data);
                let img = await puppeteer.screenshot("msg", {
                    ...data1,
                });
                e.reply(img);
                return;
            }
        }
        let mubiao = [];
        let i = 0;
        let File = fs.readdirSync(__PATH.player_path);
        File = File.filter(file => file.endsWith(".json"));
        let File_length = File.length;
        for (var k = 0; k < File_length; k++) {
            let this_qq = File[k].replace(".json", '');
            this_qq = parseInt(this_qq);
            let players = await Read_player(this_qq);
            if (players.魔道值 > 999 && this_qq != usr_qq) {
                mubiao[i] = {
                    名号: players.名号,
                    赏金: Math.trunc(1000000 * (1.2 + 0.05 * player.occupation_level) * player.level_id * player.Physique_id / 42 / 42 / 4),
                    QQ: this_qq
                }
                i++;
            }
        }
        while (i < 4) {
            mubiao[i] = {
                名号: "DD大魔王",
                赏金: Math.trunc(1000000 * (1.2 + 0.05 * player.occupation_level) * player.level_id * player.Physique_id / 42 / 42 / 4),
                QQ: 1
            }
            i++;
        }
        for (var k = 0; k < 3; k++) {
            msg.push(mubiao[Math.trunc(Math.random() * i)]);
        }
        let arr = {
            "arm": msg,
            "end_time": new Date().getTime() + 60000 * 60 * 20,//结束时间
        };
        await redis.set("xiuxian:player:" + usr_qq + ":shangjing", JSON.stringify(arr));
        var msg_data = {
            msg,
            type
        }
        const data1 = await new Show(e).get_msg(msg_data);
        let img = await puppeteer.screenshot("msg", {
            ...data1,
        });
        e.reply(img);
        return;
    }
    async taofa_sb(e) {
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let A_action = await redis.get("xiuxian:player:" + usr_qq + ":action");
        A_action = JSON.parse(A_action);
        if (A_action != null) {
            let now_time = new Date().getTime();
            //人物任务的动作是否结束
            let A_action_end_time = A_action.end_time;
            if (now_time <= A_action_end_time) {
                let m = parseInt((A_action_end_time - now_time) / 1000 / 60);
                let s = parseInt(((A_action_end_time - now_time) - m * 60 * 1000) / 1000);
                e.reply("正在" + A_action.action + "中,剩余时间:" + m + "分" + s + "秒");
                return;
            }
        }
        let player = await Read_player(usr_qq);
        if (player.occupation != "侠客") {
            e.reply("侠客资质不足,需要进行训练")
            return
        }
        let action = await redis.get("xiuxian:player:" + usr_qq + ":shangjing");
        action = await JSON.parse(action);
        if (action == null) {
            e.reply("还没有接取到悬赏,请查看后再来吧")//没接取悬赏
            return
        }
        if (action.arm.length == 0) {
            e.reply("每日限杀,请等待20小时后新的赏金目标")//悬赏做完了(20h后刷新)
            return
        }
        var num = e.msg.replace("#讨伐目标", '');
        num = num.trim() - 1;
        let qq;
        try {
            qq = action.arm[num].QQ;
        }
        catch 
        {
            e.reply("不要伤及无辜")//输错了，没有该目标
            return
        }
        let last_msg = "";
        if (qq != 1) {
            let player_B = await Read_player(qq);
            player_B.当前血量 = player_B.血量上限;

            player_B.法球倍率 = player_B.灵根.法球倍率;
            let buff = 1 + player.occupation_level * 0.055;
            let player_A = {
                id: player.id,
                名号: player.名号,
                攻击: parseInt(player.攻击 * buff),
                防御: parseInt(player.防御),
                当前血量: parseInt(player.血量上限),
                暴击率: player.暴击率,
                学习的功法: player.学习的功法,
                魔道值: player.魔道值,
                灵根: player.灵根,
                法球倍率: player.灵根.法球倍率,
                仙宠: player.仙宠,
                神石: player.神石
            }
            let Data_battle = await zd_battle(player_A, player_B);
            let msg = Data_battle.msg;
            let A_win = `${player_A.名号}击败了${player_B.名号}`;
            let B_win = `${player_B.名号}击败了${player_A.名号}`;
            if (msg.find(item => item == A_win)) {
                player_B.魔道值 -= 50;
                player_B.灵石 -= 1000000;
                player_B.当前血量 = 0;
                await Write_player(qq, player_B);
                player.灵石 += action.arm[num].赏金;
                player.魔道值 -= 5;
                await Write_player(usr_qq, player);
                await Add_职业经验(usr_qq, 2255);
                last_msg += "【全服公告】" + player_B.名号 + "失去了1000000灵石,罪恶得到了洗刷,魔道值-50,无名侠客获得了部分灵石,自己的正气提升了,同时获得了更多的悬赏加成";
            }
            else if (msg.find(item => item == B_win)) {
                var shangjing = Math.trunc(action.arm[num].赏金 * 0.5);
                player.当前血量 = 0;
                player.灵石 += shangjing;
                player.魔道值 -= 5;
                await Write_player(usr_qq, player);
                await Add_职业经验(usr_qq, 1100);
                last_msg += "【全服公告】" + player_B.名号 + "反杀了无名侠客,无名侠客只获得了部分辛苦钱";
            }
            if (msg.length > 100) {
            } else {
                await ForwardMsg(e, msg);
            }
        }
        else {
            player.灵石 += action.arm[num].赏金;
            player.魔道值 -= 5;
            await Write_player(usr_qq, player);
            await Add_职业经验(usr_qq, 2255);
            last_msg += "你惩戒了仙路窃贼,获得了部分灵石";//直接获胜
        }
        action.arm.splice(num, 1);
        await redis.set("xiuxian:player:" + usr_qq + ":shangjing", JSON.stringify(action));
        if (last_msg == "你惩戒了仙路窃贼,获得了部分灵石") {
            e.reply(last_msg);
        }
        else {
            for (var i = 0; i < this.xiuxianConfigData.Group.length; i++) {
                await this.pushInfo(this.xiuxianConfigData.Group[i], true, last_msg);
            }
        }
    }
    
    async xuanshang_sb(e) {
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = await Read_player(usr_qq);
        let qq = e.msg.replace("#悬赏", '');
        let code = qq.split("\*");
        qq = code[0];
        let money = code[1];
        if (money < 300000 || money == null || money == undefined || money == NaN) {
            money = 300000;
        }
        else {
            money = code[1].replace(/[^0-9]/ig, "");
        }
        if (money < 300000) {
            money = 300000;
            e.reply("这点灵石也想让侠客出手?已经被自动调整为300000");//悬赏金额太少，自动调整
        }
        if (player.灵石 < money) {
            e.reply("您手头这点灵石,似乎在说笑");
            return;
        }
        let player_B;
        try {
            player_B = await Read_player(qq);
        }
        catch
        {
            e.reply("世间没有这人")//查无此人
            return;
        }
        var arr = {
            名号: player_B.名号,
            QQ: qq,
            赏金: money,
        }
        let action = await redis.get("xiuxian:player:" + 1 + ":shangjing");
        action = await JSON.parse(action);
        if (action != null) {
            action.push(arr);
        }
        else {
            action = [];
            action.push(arr);
        }
        player.灵石 -= money;
        await Write_player(usr_qq, player);
        e.reply("悬赏成功!");
        let msg = "";
        msg += "【全服公告】" + player_B.名号 + "被悬赏了" + money + "灵石";
        for (var i = 0; i < this.xiuxianConfigData.Group.length; i++) {
            await this.pushInfo(this.xiuxianConfigData.Group[i], true, msg);
        }
        await redis.set("xiuxian:player:" + 1 + ":shangjing", JSON.stringify(action));
        return;
    }
    async shangjingbang(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let action = await redis.get("xiuxian:player:" + 1 + ":shangjing");
        action = await JSON.parse(action);
        if (action == null) {
            e.reply("悬赏已经被抢空了");//没人被悬赏
            return;
        }
        for (var i = 0; i < action.length - 1; i++) {
            var count = 0;
            for (var j = 0; j < action.length - i - 1; j++) {
                if (action[j].赏金 < action[j + 1].赏金) {
                    var t;
                    t = action[j];
                    action[j] = action[j + 1];
                    action[j + 1] = t;
                    count = 1;
                }
            }
            if (count == 0)
                break;
        }
        await redis.set("xiuxian:player:" + 1 + ":shangjing", JSON.stringify(action));
        let type = 1;
        var msg_data = {
            msg: action,
            type
        }
        const data1 = await new Show(e).get_msg(msg_data);
        let img = await puppeteer.screenshot("msg", {
            ...data1,
        });
        e.reply(img);
        return;
    }
    async cisha_sb(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let A_action = await redis.get("xiuxian:player:" + usr_qq + ":action");
        A_action = JSON.parse(A_action);
        if (A_action != null) {
            let now_time = new Date().getTime();
            //人物任务的动作是否结束
            let A_action_end_time = A_action.end_time;
            if (now_time <= A_action_end_time) {
                let m = parseInt((A_action_end_time - now_time) / 1000 / 60);
                let s = parseInt(((A_action_end_time - now_time) - m * 60 * 1000) / 1000);
                e.reply("正在" + A_action.action + "中,剩余时间:" + m + "分" + s + "秒");
                return;
            }
        }
        let action = await redis.get("xiuxian:player:" + 1 + ":shangjing");
        action = await JSON.parse(action);
        var num = e.msg.replace("#刺杀目标", '');
        num = num.trim() - 1;
        let qq;
        try {
            qq = action[num].QQ;
        }
        catch 
        {
            e.reply("不要伤及无辜")//输错了，没有该目标
            return
        }
        if (qq == usr_qq) {
            e.reply("咋的，自己干自己？");
            return;
        }
        let player = await Read_player(usr_qq);
        let buff = 1;
        if (player.occupation == "侠客") {
            buff = 1 + player.occupation_level * 0.055;
        }
        let last_msg = "";
        let player_B = await Read_player(qq);
        if (player_B.当前血量 == 0) {
            e.reply(`对方已经没有血了,请等一段时间再刺杀他吧`)
            return;
        }
        let B_action = await redis.get("xiuxian:player:" + qq + ":action");
        B_action = JSON.parse(B_action);
        if (B_action != null) {
            let now_time = new Date().getTime();
            //人物任务的动作是否结束
            let B_action_end_time = B_action.end_time;
            if (now_time <= B_action_end_time) {
                let ishaveyss = await exist_najie_thing(usr_qq, "隐身水", "道具");
                if (!ishaveyss) {//如果A没有隐身水，直接返回不执行
                    let m = parseInt((B_action_end_time - now_time) / 1000 / 60);
                    let s = parseInt(((B_action_end_time - now_time) - m * 60 * 1000) / 1000);
                    e.reply("对方正在" + B_action.action + "中,剩余时间:" + m + "分" + s + "秒");
                    return;
                }
            }
        }
        player_B.法球倍率 = player_B.灵根.法球倍率;
        player_B.当前血量 = player_B.血量上限;
        let player_A = {
            id: player.id,
            名号: player.名号,
            攻击: parseInt(player.攻击 * buff),
            防御: parseInt(player.防御),
            当前血量: parseInt(player.血量上限),
            暴击率: player.暴击率,
            学习的功法: player.学习的功法,
            灵根: player.灵根,
            魔道值: player.魔道值,
            神石:player.神石,
            法球倍率: player.灵根.法球倍率,
            仙宠: player.仙宠
        }
        let Data_battle = await zd_battle(player_A, player_B);
        let msg = Data_battle.msg;
        let A_win = `${player_A.名号}击败了${player_B.名号}`;
        let B_win = `${player_B.名号}击败了${player_A.名号}`;
        if (msg.find(item => item == A_win)) {
            player_B.当前血量 = 0;
            player_B.修为 -= action[num].赏金;
            await Write_player(qq, player_B)
            player.灵石 += Math.trunc(action[num].赏金 * 0.3);
            await Write_player(usr_qq, player);
            last_msg += "【全服公告】" + player_B.名号 + "被" + player.名号 + "悄无声息的刺杀了"
            //优化下文案，比如xxx在刺杀xxx中
            action.splice(num, 1);
            await redis.set("xiuxian:player:" + 1 + ":shangjing", JSON.stringify(action));

        }
        else if (msg.find(item => item == B_win)) {
            player.当前血量 = 0;
            await Write_player(usr_qq, player);
            last_msg += "【全服公告】" + player.名号 + "刺杀失败," + player_B.名号 + "勃然大怒,单手就反杀了" + player.名号;//优化下文案，比如xxx在刺杀xxx中
        }
        if (msg.length > 100) {
        } else {
            await ForwardMsg(e, msg);
        }
        for (var i = 0; i < this.xiuxianConfigData.Group.length; i++) {
            await this.pushInfo(this.xiuxianConfigData.Group[i], true, last_msg);
        }
        return;
    }
    async shoulie(e) {
        let usr_qq = e.user_id;//用户qq
        //有无存档
        if (!await existplayer(usr_qq)) {
            return;
        }
    
        //不开放私聊
        if (!e.isGroup) {
            return;
        }
    
    
        //获取游戏状态
        let game_action = await redis.get("xiuxian:player:" + usr_qq + ":game_action");
        //防止继续其他娱乐行为
        if (game_action == 0) {
            e.reply("修仙：游戏进行中...");
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.occupation != "猎户") {
            e.reply("你的狩猎许可证呢？盗猎是吧？罚款2000灵石。")
            await Add_灵石(usr_qq, -2000)
            return
        }
    
        //获取时间
        let time = e.msg.replace("#狩猎", "");
        time = time.replace("分钟", "");
        if (parseInt(time) == parseInt(time)) {
            time = parseInt(time);
            var y = 30;//时间
            var x = 24;//循环次数
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<30，修正。
            if (time < 30) {
                time = 30;
            }
        }
        else {
            //不设置时间默认30分钟
            time = 30;
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
                e.reply("正在" + action.action + "中，剩余时间:" + m + "分" + s + "秒");
                return;
            }
        }
        let action_time = time * 60 * 1000;//持续时间，单位毫秒
        let arr = {
            "action": "狩猎",//动作
            "end_time": new Date().getTime() + action_time,//结束时间
            "time": action_time,//持续时间
            "plant": "1",//采药-开启
            "shoulie": "0",//采药-开启
            "shutup": "1",//闭关状态-开启
            "working": "1",//降妖状态-关闭
            "Place_action": "1",//秘境状态---关闭
            "Place_actionplus": "1",//沉迷---关闭
            "power_up": "1",//渡劫状态--关闭
        };
        if (e.isGroup) {
            arr.group_id = e.group_id
        }
    
        await redis.set("xiuxian:player:" + usr_qq + ":action", JSON.stringify(arr));//redis设置动作
        e.reply(`现在开始外出打猎${time}分钟`);
    
        return true;
    }
    async shoulie_back(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let action = await this.getPlayerAction(e.user_id);
        let state = await this.getPlayerState(action);
        if (state == "空闲") {
            return;
        }
        if (action.action != "狩猎") {
            return;
        }
    
    
        //结算
        let end_time = action.end_time;
        let start_time = action.end_time - action.time;
        let now_time = new Date().getTime();
        let time;
        var y = this.xiuxianConfigData.mine.time;//固定时间
        var x = this.xiuxianConfigData.mine.cycle;//循环次数
    
        if (end_time > now_time) {//属于提前结束
            time = parseInt((new Date().getTime() - start_time) / 1000 / 60);
            //超过就按最低的算，即为满足30分钟才结算一次
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<15，不给收益
            if (time < y) {
                time = 0;
            }
        } else {//属于结束了未结算
            time = parseInt((action.time) / 1000 / 60);
            //超过就按最低的算，即为满足30分钟才结算一次
            //如果是 >=16*33 ----   >=30
            for (var i = x; i > 0; i--) {
                if (time >= y * i) {
                    time = y * i;
                    break;
                }
            }
            //如果<15，不给收益
            if (time < y) {
                time = 0;
            }
        }
    
        if (e.isGroup) {
            await this.shoulie_jiesuan(e.user_id, time, false, e.group_id);//提前闭关结束不会触发随机事件
        } else {
            await this.shoulie_jiesuan(e.user_id, time, false);//提前闭关结束不会触发随机事件
        }
    
        let arr = action;
        arr.is_jiesuan = 1;//结算状态
        arr.shoulie = 1;//采药状态
        arr.plant = 1;//采药状态
        arr.shutup = 1;//闭关状态
        arr.working = 1;//降妖状态
        arr.power_up = 1;//渡劫状态
        arr.Place_action = 1;//秘境
        //结束的时间也修改为当前时间
        arr.end_time = new Date().getTime();
        delete arr.group_id;//结算完去除group_id
        await redis.set("xiuxian:player:" + e.user_id + ":action", JSON.stringify(arr));
    }
    
    
     async shoulie_jiesuan(user_id, time, is_random, group_id) {
    
        let usr_qq = user_id;
        let player = data.getData("player", usr_qq);
        let now_level_id;
    
        if (!isNotNull(player.level_id)) {
            return;
        }
        let msg = [segment.at(usr_qq)];
        var size = this.xiuxianConfigData.mine.size;
        let shoulie_amount1 = Math.floor((1.8 + Math.random() * 0.4) * time);
        let shoulie_amount2 = Math.floor((1.8 + Math.random() * 0.4) * time);
        let shoulie_amount3 = Math.floor(time / 30);
        let shoulie_amount4 = Math.floor(time / 30);
        let shoulie_amount5 = Math.floor(time / 30);
        let rate = data.occupation_exp_list.find(item => item.id == player.occupation_level).rate * 10;
        let exp = 0;
        let ext = "";
        if (player.occupation == "猎户") {
            exp = time * 10;
            time *= rate;
            ext = `你是猎户，获得狩猎经验${exp}，额外获得猎物${Math.floor(rate * 100)}%，`;
        }
    
        let end_amount = Math.floor(4 * (rate + 1) * (shoulie_amount1))//稀有
        if (player.level_id <= 21) {
    
            end_amount *= player.level_id / 40
            
            msg.push("由于你境界不足化神,在狗熊岭遇见熊大熊二，摆脱他们花了很多时间，收入降低" + (1 - player.level_id / 40) * 50 + "%\n")
        } else {
            end_amount *= player.level_id / 40
           
        }
    
    
        //shoulie_amount1 = parseInt(shoulie_amount1 * time);
        //shoulie_amount2 = parseInt(shoulie_amount2 * time);
        //shoulie_amount3 = parseInt(shoulie_amount3 * time);
        //shoulie_amount4 = parseInt(shoulie_amount4 * time);
        end_amount = Math.floor(end_amount)/50;
        end_amount = Math.floor(end_amount);


                        await Add_najie_thing(usr_qq, "野兔", "食材", end_amount);
                        await Add_najie_thing(usr_qq, "野鸡", "食材", end_amount);
                        await Add_najie_thing(usr_qq, "野猪", "食材", end_amount);
                        await Add_najie_thing(usr_qq, "野牛", "食材", end_amount);
                        await Add_najie_thing(usr_qq, "野羊", "食材", end_amount);
                        await Add_职业经验(usr_qq,exp);
                        msg.push(`\n狩猎归来，${ext}\n收获野兔×${end_amount}\n野鸡×${end_amount}\n野猪×${end_amount}\n野牛×${end_amount}\n野羊×${end_amount}\n`);
    
    
    
    
        if (group_id) {
            await this.pushInfo(group_id, true, msg)
        } else {
            await this.pushInfo(usr_qq, false, msg);
        }
    
        return;
    }



    /**
     * 获取缓存中的人物状态信息
     * @param usr_qq
     * @returns {Promise<void>}
     */
    async getPlayerAction(usr_qq) {
        let action = await redis.get("xiuxian:player:" + usr_qq + ":action");
        action = JSON.parse(action);//转为json格式数据
        return action;
    }

    /**
     * 获取人物的状态，返回具体的状态或者空闲
     * @param action
     * @returns {Promise<void>}
     */
    async getPlayerState(action) {
        if (action == null) {
            return "空闲";
        }
        let now_time = new Date().getTime();
        let end_time = action.end_time;
        //当前时间>=结束时间，并且未结算 属于已经完成任务，却并没有结算的
        //当前时间<=完成时间，并且未结算 属于正在进行
        if (!((now_time >= end_time && (action.shutup == 0 || action.working == 0 || action.plant == 0 || action.min == 0)) || (now_time <= end_time && (action.shutup == 0 || action.working == 0 || action.plant == 0 || action.mine == 0||action.shoulie == 0)))) {

            return "空闲";
        }
        return action.action;
    }

    async pushInfo(id, is_group, msg) {
        if (is_group) {
            await Bot.pickGroup(id)
                .sendMsg(msg)
                .catch((err) => {
                    Bot.logger.mark(err);
                });
        } else {
            await common.relpyPrivate(id, msg);
        }
    }
}

export async function get_danfang_img(e, all_level) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }


    let danfang_list = data.danfang_list;

    let danfang_data = {
        user_id: usr_qq,
        danfang_list: danfang_list
    }
    const data1 = await new Show(e).get_danfangData(danfang_data);
    let img = await puppeteer.screenshot("danfang", {
        ...data1,
    });
    return img;
}


export async function get_tuzhi_img(e, all_level) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }


    let tuzhi_list = data.tuzhi_list;

    let tuzhi_data = {
        user_id: usr_qq,
        tuzhi_list: tuzhi_list
    }
    const data1 = await new Show(e).get_tuzhiData(tuzhi_data);
    let img = await puppeteer.screenshot("tuzhi", {
        ...data1,
    });
    return img;
}
export async function Go(e) {
    let usr_qq = e.user_id;
    //不支持私聊
    if (!e.isGroup) {
        return;
    }
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
