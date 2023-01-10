//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import {
    Read_player,
    existplayer,
    exist_najie_thing,
    instead_equipment,
    foundthing,
    Write_najie, Read_najie, isNotNull
} from '../Xiuxian/xiuxian.js'
import {Add_灵石, Add_najie_thing, Add_修为, Add_player_学习功法, Add_血气} from '../Xiuxian/xiuxian.js'
import {__PATH} from "../Xiuxian/xiuxian.js"
import {get_equipment_img} from '../ShowImeg/showData.js'
import {synchronization} from '../AdminSuper/AdminSuper.js'
import {Pushforum_ASS} from '../Help/Forum.js'
import {Synchronization_ASS} from '../Association/TreasureCabinet.js'

/**
 * 全局变量
 */
/**
 * 作者：零零零零
 * 支持一键出售物品
 * 一键服用修为丹药
 * 一键装备
 * 一键学习功法
 */
export class UserSellAll extends plugin {
    constructor() {
        super({
            name: 'UserSellAll',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#一键出售(.*)$',
                    fnc: 'Sell_all_comodities'
                },
                {
                    reg: '^#一键服用修为丹$',
                    fnc: 'all_xiuweidan'
                },
                {
                    reg: '^#一键服用血气丹$',
                    fnc: 'all_xueqidan'
                },
                {
                    reg: '^#一键装备$',
                    fnc: 'all_zhuangbei'
                },
                {
                    reg: '^#一键学习$',
                    fnc: 'all_learn'
                },
                {
                    reg: '^#一键同步$',
                    fnc: 'all_tongbu'
                },
                {
                    reg: "^#召唤天道",
                    fnc: "tiandao",
                },
                {
                    reg: '^#(锁定|解锁)(装备|道具|丹药|功法|草药|材料|盒子|仙宠|口粮).*$',
                    fnc: 'locked'
                }
            ]
        })
    }

    async locked(e) {
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
        let msg = e.msg.replace("#", '');
        let un_lock = msg.substr(0, 2);
        let thing = msg.substr(4).split("\*");
        let thing_name = thing[0];
        let thing_pinji;
        if (msg.substr(2, 2) == "装备") {
            thing_pinji = thing[1];
            if (!isNotNull(thing_pinji)) {
                e.reply("装备未指定品级！");
                return;
            }
            let pinji = ['劣', '普', '优', '精', '极', '绝', '顶'];
            let pinji_yes = true;
            for (var i = 0; i < pinji.length; i++) {
                if (pinji[i] == thing_pinji) {
                    pinji_yes = false;
                    thing_pinji = i;
                    break;
                }
            }
            if (pinji_yes) {
                e.reply("未输入正确品级");
                return;
            }
        }
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`你瓦特了吧，这方世界没有这样的东西:${thing_name}`);
            return;
        }


        let najie = await Read_najie(usr_qq);
        let ifexist;
        if (thing_exist.class == "装备") {
            ifexist = najie.装备.find(item => (item.name == thing_name && item.pinji == thing_pinji));
        }
        if (thing_exist.class == "丹药") {
            ifexist = najie.丹药.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "道具") {
            ifexist = najie.道具.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "功法") {
            ifexist = najie.功法.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "草药") {
            ifexist = najie.草药.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "材料") {
            ifexist = najie.材料.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "盒子") {
            ifexist = najie.盒子.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "仙宠") {
            ifexist = najie.仙宠.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "仙米") {
            ifexist = najie.仙宠口粮.find(item => item.name == thing_name);
        }
        if (!ifexist) {//没有
            e.reply(`你没有【${thing_name}】这样的${thing_exist.class}`);
            return;
        }
        if (ifexist.islockd == 0) {
            if (un_lock == "锁定") {
                ifexist.islockd = 1;
                await Write_najie(usr_qq, najie);
                e.reply(`${thing_exist.class}:${thing_name}已锁定`);
                return;
            } else if (un_lock == "解锁") {
                e.reply(`${thing_exist.class}:${thing_name}本就是未锁定的`);
                return;
            }
        } else if (ifexist.islockd == 1) {
            if (un_lock == "解锁") {
                ifexist.islockd = 0;
                await Write_najie(usr_qq, najie);
                e.reply(`${thing_exist.class}:${thing_name}已解锁`);
                return;
            } else if (un_lock == "锁定") {
                e.reply(`${thing_exist.class}:${thing_name}本就是锁定的`);
                return;
            }
        }
    }

    async all_tongbu(e) {
        await synchronization(e);
        await Pushforum_ASS(e);
        await Synchronization_ASS(e);
        return;
    }
     async yeslunhui(e) {
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
            await this.reply('已经取消出售');
            this.finish('yeslunhui');
            return;
        } else if (choice == "确认出售") {
            await redis.set("xiuxian:player:" + usr_qq + ":lunhui", 1);
            e.reply("请再次输入#一键出售！");
            //console.log(this.getContext().recall);
            this.finish('yeslunhui');
            return;
        }
    }

    //一键出售
    async Sell_all_comodities(e) {
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
        let lhxq = await redis.get("xiuxian:player:" + usr_qq + ":lunhui");
        if (lhxq != 1) {
            e.reply('回复:【确认出售】或者【取消】进行选择');
            this.setContext('yeslunhui');
            return;
        }
            await redis.set("xiuxian:player:" + usr_qq + ":lunhui", 0);
        let najie = await data.getData("najie", usr_qq);
        let commodities_price = 0
        let wupin = ['装备', '丹药', '道具', '功法', '草药', '材料', '盒子'];
        let wupin1 = []
        if (e.msg != '#一键出售') {
            let thing = e.msg.replace("#一键出售", '');
            for (var i of wupin) {
                if (thing.includes(i)) {
                    wupin1.push(i)
                    thing = thing.replace(i, "")
                }
            }
            if (thing.length == 0) {
                wupin = wupin1
            } else {
                return
            }
        }
        console.log(wupin);
        for (var i of wupin) {
            console.log(najie[i]);
            for (let l of najie[i]) {
                if (l && l.islockd == 0 && !(l.id >= 400991 && l.id <= 400999)) {
                    //纳戒中的数量
                    let quantity =l.数量;
                    /*console.log(l);
                    console.log(l.class);
                    console.log(quantity);*/
                    if (l.class == "装备") {
                        await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
                    } else {
                        await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
                    }
                    commodities_price = commodities_price + l.出售价 * quantity;
                }
            }
        }
        await Add_灵石(usr_qq, commodities_price);
        e.reply(`出售成功!  获得${commodities_price}灵石 `);
        return;
    }

    //#(装备|服用|使用)物品*数量
    async all_xiuweidan(e) {
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
        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let xiuwei = 0
        for (var l of najie.丹药) {
            if (l.type == '修为') {
                //纳戒中的数量
                let quantity = await exist_najie_thing(usr_qq, l.name, l.class);
                await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
                xiuwei = xiuwei + l.exp * quantity;
            }
        }
        await Add_修为(usr_qq, xiuwei);
        e.reply(`服用成功,修为增加${xiuwei}`);
        return
    }

    //#(装备|服用|使用)物品*数量
    async all_xueqidan(e) {
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
        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let xueqi = 0
        for (var l of najie.丹药) {
            if (l.type == '血气') {
                //纳戒中的数量
                let quantity = await exist_najie_thing(usr_qq, l.name, l.class);
                await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
                xueqi = xueqi + l.xueqi * quantity;
            }
        }
        await Add_血气(usr_qq, xueqi);
        e.reply(`服用成功,血气增加${xueqi}`);
        return
    }

    async all_zhuangbei(e) {
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
        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let equipment = await data.getData("equipment", usr_qq);
        let wuqi = equipment.武器;
        let fabao = equipment.法宝;
        let huju = equipment.护具;
//选择最高攻击武器,最高暴击法宝,最高防御护具
        for (var i = 0; i < najie.装备.length; i++) {
            if (najie.装备[i].type == "武器") {
                if (wuqi.atk < najie.装备[i].atk) {
                    wuqi = najie.装备[i];
                } else if (wuqi.atk == najie.装备[i].atk) {
                    if (wuqi.bao < najie.装备[i].bao) {
                        wuqi = najie.装备[i];
                    }
                }
            } else if (najie.装备[i].type == "法宝") {
                if (fabao.bao < najie.装备[i].bao) {
                    fabao = najie.装备[i];
                } else if (fabao.bao == najie.装备[i].bao) {
                    if (fabao.atk < najie.装备[i].atk) {
                        fabao = najie.装备[i];
                    }
                }
            } else if (najie.装备[i].type == "护具") {
                if (huju.def < najie.装备[i].def) {
                    huju = najie.装备[i];
                } else if (huju.def == najie.装备[i].def) {
                    if (huju.HP < najie.装备[i].HP) {
                        huju = najie.装备[i];
                    }
                }
            }
        }
        if (wuqi.name == equipment.武器.name && wuqi.pinji == equipment.武器.pinji) {
        } else {
            await instead_equipment(usr_qq, wuqi);
        }
        if (fabao.name == equipment.法宝.name && fabao.pinji == equipment.法宝.pinji) {
        } else {
            await instead_equipment(usr_qq, fabao);
        }
        if (huju.name == equipment.护具.name && huju.pinji == equipment.护具.pinji) {
        } else {
            await instead_equipment(usr_qq, huju);
        }
        let img = await get_equipment_img(e);
        e.reply(img);
        return;
    }

    async all_learn(e) {
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
        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let gongfa = []
        let player = await Read_player(usr_qq);
        let name = ''
        for (var l of najie.功法) {
            let islearned = player.学习的功法.find(item => item == l.name);
            if (!islearned) {
                await Add_najie_thing(usr_qq, l.name, "功法", -1);
                await Add_player_学习功法(usr_qq, l.name);
                name = name + ' ' + l.name
            }
        }
        if (name) {
            e.reply(`你学会了${name},可以在【#我的炼体】中查看`);
        } else {
            e.reply('无新功法');
        }
        return;
    }
}