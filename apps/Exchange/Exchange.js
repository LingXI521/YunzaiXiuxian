import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import fs from 'fs';
import path from 'path';
import Show from '../../model/show.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import {__PATH, Locked_najie_thing} from '../Xiuxian/xiuxian.js';
import {
    existplayer,
    exist_najie_thing,
    ForwardMsg,
    Read_player,
    isNotNull,
    Read_najie,
    foundthing,
} from '../Xiuxian/xiuxian.js';
import {Add_najie_thing, Add_灵石} from '../Xiuxian/xiuxian.js';
import console from 'console';

/**
 * 全局变量
 */
let allaction = false; //全局状态判断
/**
 * 交易系统
 */
export class Exchange extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'Exchange',
            /** 功能描述 */
            dsc: '交易模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#冲水堂$',
                    fnc: 'show_supermarket',
                },
                {
                    reg: '^#上架.*(\\*[\u4e00-\u9fa5])?(\\*[1-9]\d)*(\\*[1-9]\d)*',
                    fnc: 'onsell',
                },
                {
                    reg: '^#下架[1-9]\d*',
                    fnc: 'Offsell',
                },
                {
                    reg: '^#选购[^*]*(\\*[0-9]*)?$',
                    fnc: 'purchase',
                },
            ],
        });
    }
    async Offsell(e) {
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
        //let Ex = await redis.get("xiuxian:player:" + usr_qq + ":Exchange");
        //if (Ex != 1) {
        //    e.reply("没有上架物品！");
        //    return;
        //	}
        //防并发cd
        var time0 = 2; //分钟cd
        //获取当前时间
        let now_time = new Date().getTime();
        let ExchangeCD = await redis.get(
            'xiuxian:player:' + usr_qq + ':ExchangeCD'
        );
        ExchangeCD = parseInt(ExchangeCD);
        let transferTimeout = parseInt(60000 * time0);
        if (now_time < ExchangeCD + transferTimeout) {
            let ExchangeCDm = Math.trunc(
                (ExchangeCD + transferTimeout - now_time) / 60 / 1000
            );
            let ExchangeCDs = Math.trunc(
                ((ExchangeCD + transferTimeout - now_time) % 60000) / 1000
            );
            e.reply(
                `每${transferTimeout / 1000 / 60}分钟操作一次，` +
                `CD: ${ExchangeCDm}分${ExchangeCDs}秒`
            );
            //存在CD。直接返回
            return;
        }
        let Exchange;
        //记录本次执行时间
        await redis.set('xiuxian:player:' + usr_qq + ':ExchangeCD', now_time);
        let player = await Read_player(usr_qq);
        //let now_level_id;
        if (!isNotNull(player.level_id)) {
            e.reply('请先#同步信息');
            return;
        }
        let x = parseInt(e.msg.replace('#下架', '')) - 1;
        try {
            Exchange = await Read_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        if (x >= Exchange.length) {
            e.reply(`没有编号为${x + 1}的物品`);
            return;
        }
        //let thingqq = e.msg.replace("#", '');
        let thingqq = Exchange[x].qq;
        //thingqq = thingqq.replace("下架", '');
        //if (thingqq == "") {
        //    return;
        //}
        //let x = 888888888;
        //if(thingqq!=usr_qq){
        //	e.reply(`不能下架别人上架的物品`);
        //	return;
        //}
        //for (var i = 0; i < Exchange.length; i++) {
        //    //对比编号
        //   if (Exchange[i].qq == thingqq) {
        //        x = i;
        //        break;
        //    }
        //}
        //if (x == 888888888) {
        //    e.reply("找不到该商品编号！");
        //    return;
        //}
        //要查看冷却
        let nowtime = new Date().getTime();
        let end_time = Exchange[x].end_time;
        let time = (end_time - nowtime) / 60000;
        //time = Math.trunc(time);
        //if (time <= 0) {
        //对比qq是否相等
        if (thingqq != usr_qq) {
            e.reply('不能下架别人上架的物品');
            return;
        }
        if (player.灵石 <= 100000) {
            e.reply('下架物品至少上交10w保证金,你手里似乎没有那么多');
            return;
        }
        let thing_name = Exchange[x].name.name;
        let thing_class = Exchange[x].name.class;
        let thing_amount = Exchange[x].aconut;
        let pinji = null;
        if (thing_class == '装备') {
            pinji = Exchange[x].pinji2;
        }
        await Add_najie_thing(usr_qq, thing_name, thing_class, thing_amount, pinji);
        //Exchange = Exchange.filter(item => item.qq != thingqq);
        Exchange.splice(x, 1);
        await Write_Exchange(Exchange);
        await Add_灵石(usr_qq, -100000);
        await redis.set('xiuxian:player:' + thingqq + ':Exchange', 0);
        e.reply(player.名号 + '赔10W保金！并下架' + thing_name + '成功！');
        let addWorldmoney = 50000;
        let Worldmoney = await redis.get('Xiuxian:Worldmoney');
        if (
            Worldmoney == null ||
            Worldmoney == undefined ||
            Worldmoney <= 0 ||
            Worldmoney == NaN
        ) {
            Worldmoney = 1;
        }
        Worldmoney = Number(Worldmoney);
        Worldmoney = Worldmoney + addWorldmoney;
        Worldmoney = Number(Worldmoney);
        await redis.set('Xiuxian:Worldmoney', Worldmoney);
        //}
        //else {
        //	let m = parseInt(time / 1000 / 60);
        //    let s = parseInt((time - m * 60 * 1000) / 1000);
        //   e.reply(`物品冷却中...剩余${m}分${s}秒`);
        //}
        return;
    }

    //上架
    async onsell(e) {
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
        //let Ex = await redis.get("xiuxian:player:" + usr_qq + ":Exchange");
        //if (Ex == 1) {
        //    e.reply("已有上架物品");
        //    return;
        //}
        let player = await Read_player(usr_qq)
        // if (player.魔道值 > 100) {
        //     e.reply(`${player.名号}你一个大魔头还妄想出现在尘世？`);
        //     return;
        // }
        let thing = e.msg.replace('#', '');
        thing = thing.replace('上架', '');
        let code = thing.split('*');
        let thing_name = code[0]; //物品
        let thing_value = code[1]; //价格
        let thing_amount = code[2]; //数量
        let pinji=null;
        if (code.length==3) {
            thing_name=code[0];
            thing_value=code[1];
            thing_amount=code[2];
            
        }
        else if(code.length==4){
            thing_name=code[0];
            pinji=code[1];
            thing_value=code[2];
            thing_amount=code[3];
            
        }
        if (
            thing_amount < 1 ||
            thing_amount == null ||
            thing_amount == undefined ||
            thing_amount == NaN
        ) {
            thing_amount = 1;
        }
        if (thing_value < 1) {
            e.reply('休想卡bug');
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
            e.reply(`这方世界没有[${thing_name}]`);
            return;
        }
        if (thing_exist.id >= 400991 && thing_exist.id <= 400999) {
            e.reply(`轮回功法${thing_name}禁止出售。`)
            return;
        } 
        //判断戒指中是否存在
        let thing_quantity = await exist_najie_thing(usr_qq,thing_name,thing_exist.class,pinji);
        if (!thing_quantity) {
            //没有
            e.reply(`你没有[${thing_name}]这样的${thing_exist.class}`);
            return;
        }
        if (await Locked_najie_thing(usr_qq, thing_name, thing_exist.class,pinji) == 1) {
            //锁定
            e.reply(`你的纳戒中的${thing_exist.class}[${thing_name}]是锁定的`);
            return;
        }
        //判断戒指中的数量
        if (thing_quantity < thing_amount) {
            //不够
            e.reply(`你目前只有[${thing_name}]*${thing_quantity}`);
            return;
        }
        //修正数值非整数
        thing_value = Math.trunc(thing_value); //价格
        thing_amount = Math.trunc(thing_amount); //数量
        // 价格阈值设定
        /*if (thing_value <= thing_exist.出售价 * 0.8 && thing_exist.出售价 != 1) {
            e.reply('价格过低');
            return;
        }
        if (thing_value >= thing_exist.出售价 * 3 && thing_exist.出售价 != 1) {
            e.reply('价格过高');
            return;
        }
        if(thing_exist.出售价 == 1 && thing_value > 5000000) {
            e.reply('价格过高');
            return;
        }*/
        /* if (z >= 5) {
                //是限定武器：价格随意至少10w
                if (thing_value <= 100000 && thing_value > 100000000) {
                    //价格过低，价格过高
                    e.reply("限定物品错误价格");
                    return;
                }
            }
            else {
                if (thing_value <= thing_exist.出售价 * 0.8) {
                    e.reply("价格过低");
                    return;
                }
                if (thing_value >= thing_exist.出售价 * 3) {
                    e.reply("价格过高");
                    return;
            }
            } */
        let Exchange;
        try {
            Exchange = await Read_Exchange();
        } catch {
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        let now_time = new Date().getTime();
        let whole = thing_value * thing_amount;
        whole = Math.trunc(whole);
        let time = 2; //分钟
        let najie = await Read_najie(usr_qq);
        if (thing_exist.class == '装备') {
           
            let pinji = ['劣', '普', '优', '精', '极', '绝', '顶'];
            pinji = pinji[pj];
            var wupin = {
                qq: usr_qq,
                name: thing_exist,
                price: thing_value,
                pinji: pinji,
                pinji2: pj,
                aconut: thing_amount,
                whole: whole,
                now_time: now_time,
                end_time: now_time + 60000 * time,
            };
            await Add_najie_thing(
                usr_qq,
                thing_name,
                thing_exist.class,
                -thing_amount,
               pj
            );
        } else {
            var wupin = {
                qq: usr_qq,
                name: thing_exist,
                price: thing_value,
                aconut: thing_amount,
                whole: whole,
                now_time: now_time,
                end_time: now_time + 60000 * time,
            };
            await Add_najie_thing(
                usr_qq,
                thing_name,
                thing_exist.class,
                -thing_amount
            );
        }
        //
        Exchange.push(wupin);
        //写入
        await Write_Exchange(Exchange);
        e.reply('上架成功！');
        await redis.set('xiuxian:player:' + usr_qq + ':Exchange', 1);
        return;
    }

    async show_supermarket(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let img = await get_supermarket_img(e);
        e.reply(img);
        return;
    }

    async yuansu(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let img = await get_yuansu_img(e);
        e.reply(img);
        return;
    }

    async purchase(e) {
        //选购需要常用判断
        //固定写法
        let usr_qq = e.user_id;
        //全局状态判断
        await Go(e);
        if (allaction) {
        } else {
            return;
        }
        allaction = false;
        //防并发cd
        var time0 = 1; //分钟cd
        //获取当前时间
        let now_time = new Date().getTime();
        let ExchangeCD = await redis.get(
            'xiuxian:player:' + usr_qq + ':ExchangeCD'
        );
        ExchangeCD = parseInt(ExchangeCD);
        let transferTimeout = parseInt(60000 * time0);
        if (now_time < ExchangeCD + transferTimeout) {
            let ExchangeCDm = Math.trunc(
                (ExchangeCD + transferTimeout - now_time) / 60 / 1000
            );
            let ExchangeCDs = Math.trunc(
                ((ExchangeCD + transferTimeout - now_time) % 60000) / 1000
            );
            e.reply(
                `每${transferTimeout / 1000 / 60}操作一次，` +
                `CD: ${ExchangeCDm}分${ExchangeCDs}秒`
            );
            //存在CD。直接返回
            return;
        }
        //记录本次执行时间
        await redis.set('xiuxian:player:' + usr_qq + ':ExchangeCD', now_time);
        let player = await Read_player(usr_qq)
        let now_level_id;
        if (!isNotNull(player.level_id)) {
            e.reply('请先#同步信息');
            return;
        }
        let Exchange;
        try {
            Exchange = await Read_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        let t = e.msg.replace('#选购', '').split('*');
        //let thingqq = t[0];
        let x = parseInt(t[0]) - 1;
        if (x >= Exchange.length) {
            return;
        }
        let thingqq = Exchange[x].qq;
        //let thingqq = e.msg.replace("#", '');
        //拿到物品与数量
        //thingqq = thingqq.replace("选购", '');
        if (thingqq == usr_qq) {
            e.reply('自己买自己的东西？我看你是闲得蛋疼！');
            return;
        }
        if (thingqq == '') {
            return;
        }
        //let x = 888888888;
        //根据物品的qq主人来购买
        //for (var i = 0; i < Exchange.length; i++) {
        //对比编号
        //    if (Exchange[i].qq == thingqq) {
        //        x = i;
        //        break;
        //    }
        //}
        //if (x == 888888888) {
        //    e.reply("找不到该商品编号！");
        //    return;
        //}
        let n;
        if (t.length == 1) {
            n = Exchange[x].aconut;
        } else if (t.length == 2) {
            n = Number(t[1]);
        } else {
            return;
        }
        //要查看冷却
        let nowtime = new Date().getTime();
        let end_time = Exchange[x].end_time;
        let time = (end_time - nowtime) / 60000;
        time = Math.trunc(time);
        //if (time <= 0) {
        //根据qq得到物品
        let thing_name = Exchange[x].name.name;
        let thing_class = Exchange[x].name.class;
        let thing_whole = Exchange[x].whole;
        let thing_amount = Exchange[x].aconut;
        let thing_price = Exchange[x].price;
        let pinji = Exchange[x].pinji2;
        let money = n * thing_price;
        if (n > thing_amount) {
            e.reply(`冲水堂没有这么多【${thing_name}】!`);
            return;
        }
        //查灵石
        if (player.灵石 > money) {
            //加物品
            await Add_najie_thing(usr_qq, thing_name, thing_class, n, pinji);
            //扣钱
            await Add_灵石(usr_qq, -money);
            let addWorldmoney = Math.ceil(money * 0.1);
            //thing_whole = thing_whole * 0.9;
            //thing_whole = Math.trunc(thing_whole);
            //加钱
            await Add_灵石(thingqq, Math.floor(money * 0.9));
            Exchange[x].aconut = Exchange[x].aconut - n;
            Exchange[x].whole = Exchange[x].whole - money;
            //删除该位置信息
            Exchange = Exchange.filter(item => item.aconut > 0);
            await Write_Exchange(Exchange);
            //改状态
            await redis.set('xiuxian:player:' + thingqq + ':Exchange', 0);
            e.reply(`${player.名号}在冲水堂购买了${n}个【${thing_name}】！`);
            //金库
            let Worldmoney = await redis.get('Xiuxian:Worldmoney');
            if (
                Worldmoney == null ||
                Worldmoney == undefined ||
                Worldmoney <= 0 ||
                Worldmoney == NaN
            ) {
                Worldmoney = 1;
            }
            Worldmoney = Number(Worldmoney);
            Worldmoney = Worldmoney + addWorldmoney;
            Worldmoney = Number(Worldmoney);
            await redis.set('Xiuxian:Worldmoney', Worldmoney);
        } else {
            e.reply('醒醒，你没有那么多钱！');
            return;
        }
        //}
        //else {
        //	let m = parseInt(time / 1000 / 60);
        //    let s = parseInt((time - m * 60 * 1000) / 1000);
        //    e.reply(`物品冷却中...剩余${m}分${s}秒`);
        //}
        return;
    }
}

//写入交易表
export async function Write_Exchange(wupin) {
    let dir = path.join(__PATH.Exchange, `Exchange.json`);
    let new_ARR = JSON.stringify(wupin, '', '\t');
    fs.writeFileSync(dir, new_ARR, 'utf8', err => {
        console.log('写入成功', err);
    });
    return;
}

//读交易表
export async function Read_Exchange() {
    let dir = path.join(`${__PATH.Exchange}/Exchange.json`);
    let Exchange = fs.readFileSync(dir, 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return 'error';
        }
        return data;
    });
    //将字符串数据转变成数组格式
    Exchange = JSON.parse(Exchange);
    return Exchange;
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
    let game_action = await redis.get(
        'xiuxian:player:' + usr_qq + ':game_action'
    );
    //防止继续其他娱乐行为
    if (game_action == 0) {
        e.reply('修仙：游戏进行中...');
        return;
    }
    //查询redis中的人物动作
    let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
    action = JSON.parse(action);
    if (action != null) {
        //人物有动作查询动作结束时间
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
            e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
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

export async function get_supermarket_img(e, thing_type) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) {
        return;
    }
    let Exchange_list;
    try {
        Exchange_list = await Read_Exchange();
    } catch {
        await Write_Exchange([]);
        Exchange_list = await Read_Exchange();
    }
    let supermarket_data = {
        user_id: usr_qq,
        Exchange_list: Exchange_list,
    };
    const data1 = await new Show(e).get_supermarketData(supermarket_data);
    let img = await puppeteer.screenshot('supermarket', {
        ...data1,
    });
    return img;
}

export async function get_yuansu_img(e, thing_type) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) {
        return;
    }
    let Exchange_list = data.yuansuwuqi_list;
    console.log(Exchange_list);
    let supermarket_data = {
        user_id: usr_qq,
        Exchange_list: Exchange_list,
    };
    const data1 = await new Show(e).get_yuansu(supermarket_data);
    let img = await puppeteer.screenshot('tujian', {
        ...data1,
    });
    return img;
}
