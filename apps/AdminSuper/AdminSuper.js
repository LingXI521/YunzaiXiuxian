import plugin from '../../../../lib/plugins/plugin.js';
import fs from 'node:fs';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import {get_player_img} from '../ShowImeg/showData.js';
import {
    existplayer,
    Add_修为,
    isNotNull,
    Write_player,
    Write_najie,
    Read_equipment,
    Read_najie,
    Write_equipment,
    ForwardMsg,
    TEXT_battle,
    Read_updata_log,
} from '../Xiuxian/xiuxian.js';
import {Read_Exchange, Write_Exchange} from '../Exchange/Exchange.js';
import {Read_player, __PATH} from '../Xiuxian/xiuxian.js';
import {Read_Forum, Write_Forum} from '../Help/Forum.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import Show from '../../model/show.js';

/**
 * 修仙设置
 */
export class AdminSuper extends plugin {
    constructor() {
        super({
            name: 'Yunzai_Bot_AdminSuper',
            dsc: '修仙设置',
            event: 'message',
            priority: 100,
            rule: [
                {
                    reg: '^#解封.*$',
                    fnc: 'relieve',
                },
                {
                    reg: '^#解除所有$',
                    fnc: 'Allrelieve',
                },
                {
                    reg: '^#打落凡间.*$',
                    fnc: 'Knockdown',
                },
                {
                    reg: '^#清除冲水堂$',
                    fnc: 'Deleteexchange',
                },
                {
                    reg: '^#清除.*$',
                    fnc: 'Deletepurchase',
                },
                {
                    reg: '^#放出怪物$',
                    fnc: 'OpenBoss',
                },
                {
                    reg: '^#关上怪物$',
                    fnc: 'DeleteBoss',
                },
                {
                    reg: '^#清空委托$',
                    fnc: 'DeleteForum',
                },
                {
                    reg: '^#修仙世界$',
                    fnc: 'Worldstatistics',
                },
                {
                    reg: '^#发修为补偿.*$',
                    fnc: 'xiuweiFuli',
                },
                {
                    reg: '^#测试$',
                    fnc: 'cesi',
                },
                {
                    reg: '^#查看日志$',
                    fnc: 'show_log',
                },
                {
                    reg: '^#炼丹师更新$',
                    fnc: 'liandanshi',
                },
            ],
        });
        this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
    }

    async liandanshi(e) {
        if (!e.isMaster) {
            e.reply('你凑什么热闹');
            return;
        }
        let File = fs.readdirSync(__PATH.player_path);
        File = File.filter(file => file.endsWith(".json"));
        let File_length = File.length;
        let action1 = []
        let i = 0
        for (let k = 0; k < File_length; k++) {
            let this_qq = File[k].replace(".json", '');
            this_qq = parseInt(this_qq)
            action1[i] =
                {
                    biguan: 0,//闭关状态
                    biguanxl: 0,//增加效率
                    xingyun: 0,
                    lianti: 0,
                    ped: 0,
                    modao: 0,
                    beiyong1: 0,
                    beiyong2: 0,
                    beiyong3: 0,
                    beiyong4: 0,
                    beiyong5: 0,
                    qq: this_qq
                }
            i++
        }
        await redis.set("xiuxian:player:" + 10 + ":biguang", JSON.stringify(action1))

        e.reply('更新完毕')
        return
    }

    async show_log(e) {
        let j;
        const reader = await Read_updata_log();
        let str = [];
        let line_log = reader.trim().split('\n'); //读取数据并按行分割
        line_log.forEach((item, index) => {
            // 删除空项
            if (!item) {
                line_log.splice(index, 1);
            }
        });
        for (let y = 0; y < line_log.length; y++) {
            let temp = line_log[y].trim().split(/\s+/); //读取数据并按空格分割
            let i = 0;
            if (temp.length == 4) {
                str.push(temp[0]);
                i = 1;
            }
            let t = '';
            for (let x = i; x < temp.length; x++) {
                t += temp[x];
                //console.log(t)
                if (x == temp.length - 2 || x == temp.length - 3) {
                    t += '\t';
                }
            }
            str.push(t);
            //str += "\n";
        }
        let T;
        for (j = 0; j < str.length / 2; j++) {
            T = str[j];
            str[j] = str[str.length - 1 - j];
            str[str.length - 1 - j] = T;
        }
        for (j = str.length - 1; j > -1; j--) {
            if (
                str[j] == '零' ||
                str[j] == '打铁的' ||
                str[j] == '香菜' ||
                str[j] == '魔术师' ||
                str[j] == '画手' ||
                str[j] == '摸鱼' ||
                str[j] == '闹钟'
            ) {
                let m = j;
                while (
                    str[m - 1] != '零' &&
                    str[m - 1] != '打铁的' &&
                    str[m - 1] != '香菜' &&
                    str[m - 1] != '魔术师' &&
                    str[m - 1] != '画手' &&
                    str[m - 1] != '摸鱼' &&
                    str[m - 1] != '闹钟' &&
                    m > 0
                    ) {
                    T = str[m];
                    str[m] = str[m - 1];
                    str[m - 1] = T;
                    m--;
                }
            }
        }
        //console.log("jg:\n" + " " + str);
        let log_data = {
            log: str,
        };
        const data1 = await new Show(e).get_logData(log_data);
        let img = await puppeteer.screenshot('log', {
            ...data1,
        });
        e.reply(img);
        return;
    }

    async cesi(e) {
        if (!e.isMaster) {
            e.reply('你凑什么热闹');
            return;
        }
        let a = await Read_player(e.user_id);
        let b = await Read_player(3479823546);
        a.法球倍率 = a.灵根.法球倍率;
        b.法球倍率 = b.灵根.法球倍率;
        let last = await TEXT_battle(a, b);
        await ForwardMsg(e, last.msg);
    }

//修为补偿
    async xiuweiFuli(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        if (!e.isMaster) {
            return;
        }
        //获取发送修为数量
        let xiuweibuchang = e.msg.replace('#', '');
        xiuweibuchang = xiuweibuchang.replace('发', '');
        xiuweibuchang = xiuweibuchang.replace('修为补偿', '');
        const pattern = new RegExp('[0-9]+');
        const str = xiuweibuchang;
        if (!pattern.test(str)) {
            e.reply(`错误福利`);
            return;
        }
        //校验输入修为数
        if (
            parseInt(xiuweibuchang) == parseInt(xiuweibuchang) &&
            parseInt(xiuweibuchang) > 0
        ) {
            xiuweibuchang = parseInt(xiuweibuchang);
        } else {
            xiuweibuchang = 100; //没有输入正确数字或不是正数
        }
        let isat = e.message.some(item => item.type === 'at');
        if (!isat) {
            return;
        }
        let atItem = e.message.filter(item => item.type === 'at');
        let this_qq = atItem[0].qq;
        //有无存档
        let ifexistplay = await existplayer(this_qq);
        if (!ifexistplay) {
            e.reply(`此人尚未踏入仙途`);
            return;
        }
        let player = await data.getData('player', this_qq);
        await Add_修为(this_qq, xiuweibuchang);
        e.reply(`【全服公告】 ${player.名号} 获得${xiuweibuchang}修为的补偿`);
        return;
    }

    async Worldstatistics(e) {
        if (!e.isGroup) {
            return;
        }
        if (!e.isMaster) {
            return;
        }
        let acount = 0;
        let lower = 0;
        let senior = 0;
        lower = Number(lower);
        senior = Number(senior);
        //获取缓存中人物列表
        let playerList = [];
        let files = fs
            .readdirSync(
                './plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player'
            )
            .filter(file => file.endsWith('.json'));
        for (let file of files) {
            file = file.replace('.json', '');
            playerList.push(file);
        }
        for (let player_id of playerList) {
            let player = await Read_player(player_id);
            let now_level_id;
            if (!isNotNull(player.level_id)) {
                e.reply('请先#同步信息');
                return;
            }
            now_level_id = data.Level_list.find(
                item => item.level_id == player.level_id
            ).level_id;
            if (now_level_id <= 41) {
                lower++;
            } else {
                senior++;
            }
            acount++;
        }
        let msg = [];
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
        if (Worldmoney < 10000) {
            Worldmoney = Worldmoney.toFixed(2);
            msg = [
                '___[修仙世界]___' +
                '\n人数：' +
                acount +
                '\n修道者：' +
                senior +
                '\n修仙者：' +
                lower +
                '\n财富：' +
                Worldmoney +
                '\n人均：' +
                (Worldmoney / acount).toFixed(3),
            ];
        } else if (Worldmoney > 10000 && Worldmoney < 1000000) {
            Worldmoney = Worldmoney / 10000;
            Worldmoney = Worldmoney.toFixed(2);
            msg = [
                '___[修仙世界]___' +
                '\n人数：' +
                acount +
                '\n修道者：' +
                senior +
                '\n修仙者：' +
                lower +
                '\n财富：' +
                Worldmoney +
                '万' +
                '\n人均：' +
                (Worldmoney / acount).toFixed(3) +
                '万',
            ];
        } else if (Worldmoney > 1000000 && Worldmoney < 100000000) {
            Worldmoney = Worldmoney / 1000000;
            Worldmoney = Worldmoney.toFixed(2);
            msg = [
                '___[修仙世界]___' +
                '\n人数：' +
                acount +
                '\n修道者：' +
                senior +
                '\n修仙者：' +
                lower +
                '\n财富：' +
                Worldmoney +
                '百万' +
                '\n人均：' +
                (Worldmoney / acount).toFixed(3) +
                '百万',
            ];
        } else if (Worldmoney > 100000000) {
            Worldmoney = Worldmoney / 100000000;
            Worldmoney = Worldmoney.toFixed(2);
            msg = [
                '___[修仙世界]___' +
                '\n人数：' +
                acount +
                '\n修道者：' +
                senior +
                '\n修仙者：' +
                lower +
                '\n财富：' +
                Worldmoney +
                '亿' +
                '\n人均：' +
                (Worldmoney / acount).toFixed(3) +
                '亿',
            ];
        }
        await ForwardMsg(e, msg);
        return;
    }

    async DeleteForum(e) {
        if (!e.isMaster) {
            return;
        }
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
        for (let i = 0; i < Forum.length; i++) {
            Forum = Forum.filter(item => item.qq != Forum[i].qq);
            Write_Forum(Forum);
        }
        e.reply('已清理！');
        return;
    }

    async DeleteForum(e) {
        if (!e.isMaster) {
            return;
        }
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
        for (let i = 0; i < Forum.length; i++) {
            Forum = Forum.filter(item => item.qq != Forum[i].qq);
            Write_Forum(Forum);
        }
        e.reply('已清理！');
        return;
    }

    async DeleteBoss(e) {
        if (!e.isMaster) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        //boss分为金角大王、银角大王、魔王
        //魔王boss
        await redis.set('BossMaxplus', 1);
        await redis.del('BossMaxplus');
        //金角大王
        await redis.set('BossMax', 1);
        await redis.del('BossMax');
        //银角大王
        await redis.set('BossMini', 1);
        await redis.del('BossMini');
        e.reply('关闭成功');
        return;
    }

    async OpenBoss(e) {
        if (!e.isMaster) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let User_maxplus = 1; //所有仙人数
        User_maxplus = Number(User_maxplus);
        let User_max = 1; //所有高段
        User_max = Number(User_max);
        let User_mini = 1; //所有低段
        User_mini = Number(User_mini);
        let playerList = [];
        let files = fs
            .readdirSync(
                './plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player'
            )
            .filter(file => file.endsWith('.json'));
        for (let file of files) {
            file = file.replace('.json', '');
            playerList.push(file);
        }
        for (let player_id of playerList) {
            let usr_qq = player_id;
            //读取信息
            let player = await Read_player(usr_qq);
            let now_level_id;
            if (!isNotNull(player.level_id)) {
                return;
            }
            now_level_id = data.Level_list.find(
                item => item.level_id == player.level_id
            ).level_id;
            if (now_level_id >= 42) {
                User_maxplus++;
            } else if (now_level_id > 21 && now_level_id < 42) {
                User_max++;
            } else {
                User_mini++;
            }
        }
        //打一下多少灵石
        //魔王初始化
        let money = 1000 * this.xiuxianConfigData.Boss.Boss;
        let attack = money * 2;
        let defense = money * 2;
        let blood = money * 2;
        //限制最高人数
        if (User_maxplus >= 30) {
            User_maxplus = 30;
        }
        //这里判断一下，为1就不丢数据了。
        await redis.set('BossMaxplus', 1);
        if (User_maxplus != 1) {
            //初始化属性
            let BossMaxplus = {
                name: '魔王',
                attack: attack * User_maxplus * 3,
                defense: defense * User_maxplus * 3,
                blood: blood * User_maxplus * 3,
                probability: '0.7',
                money: money * User_maxplus * 3,
                linggen: '仙之心·水',
            };
            //redis初始化
            await redis.set('xiuxian:BossMaxplus', JSON.stringify(BossMaxplus));
            await redis.set('BossMaxplus', 0);
        }
        if (User_max >= 25) {
            User_max = 25;
        }
        await redis.set('BossMax', 1);
        if (User_max != 1) {
            //初始化属性
            let BossMax = {
                name: '金角大王',
                attack: attack * User_max * 2,
                defense: defense * User_max * 2,
                blood: blood * User_max * 2,
                probability: '0.5',
                money: money * User_max * 2,
                linggen: '仙之心·火',
            };
            //redis初始化
            await redis.set('xiuxian:BossMax', JSON.stringify(BossMax));
            //金角大王
            await redis.set('BossMax', 0);
        }
        if (User_mini >= 20) {
            User_mini = 20;
        }
        await redis.set('BossMini', 1);
        if (User_mini != 1) {
            //初始化属性
            let BossMini = {
                name: '银角大王',
                attack: attack * User_mini,
                defense: defense * User_mini,
                blood: blood * User_mini,
                probability: '0.3',
                money: money * User_mini,
                linggen: '仙之心·风',
            };
            //redis初始化
            await redis.set('xiuxian:BossMini', JSON.stringify(BossMini));
            //银角大王
            await redis.set('BossMini', 0);
        }
        e.reply('开启成功');
        return;
    }

    async Deletepurchase(e) {
        if (!e.isMaster) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let thingqq = e.msg.replace('#', '');
        //拿到物品与数量
        thingqq = thingqq.replace('清除', '');
        if (thingqq == '') {
            return;
        }
        let x = 888888888;
        //根据物品的qq主人来购买
        let Exchange;
        try {
            Exchange = await Read_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        for (let i = 0; i < Exchange.length; i++) {
            //对比编号
            if (Exchange[i].qq == thingqq) {
                x = i;
                break;
            }
        }
        if (x == 888888888) {
            e.reply('找不到该商品编号！');
            return;
        }
        //删除该位置信息
        Exchange = Exchange.filter(item => item.qq != thingqq);
        await Write_Exchange(Exchange);
        //改状态
        await redis.set('xiuxian:player:' + thingqq + ':Exchange', 0);
        e.reply('清除' + thingqq);
        return;
    }

    async Deleteexchange(e) {
        if (!e.isMaster) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        e.reply('开始清除！');
        let Exchange;
        try {
            Exchange = await Read_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        for (let i = 0; i < Exchange.length; i++) {
            //自我清除
            Exchange = Exchange.filter(item => item.qq != Exchange[i].qq);
            Write_Exchange(Exchange);
        }
        //遍历所有人，清除redis
        let playerList = [];
        let files = fs
            .readdirSync(
                './plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player'
            )
            .filter(file => file.endsWith('.json'));
        for (let file of files) {
            file = file.replace('.json', '');
            playerList.push(file);
        }
        for (let player_id of playerList) {
            await redis.set('xiuxian:player:' + player_id + ':Exchange', 0);
        }
        e.reply('清除完成！');
        return;
    }

//#我的信息
    async Show_player(e) {
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('此功能暂时不开放私聊');
            return;
        }
        let img = await get_player_img(e);
        e.reply(img);
        return;
    }

    async Allrelieve(e) {
        if (!e.isMaster) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        e.reply('开始行动！');
        let playerList = [];
        let files = fs
            .readdirSync(
                './plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player'
            )
            .filter(file => file.endsWith('.json'));
        for (let file of files) {
            file = file.replace('.json', '');
            playerList.push(file);
        }
        for (let player_id of playerList) {
            //清除游戏状态
            await redis.set('xiuxian:player:' + player_id + ':game_action', 1);
            let action = await redis.get('xiuxian:player:' + player_id + ':action');
            action = JSON.parse(action);
            //不为空，存在动作
            if (action != null) {
                await redis.del('xiuxian:player:' + player_id + ':action');
                let arr = action;
                arr.is_jiesuan = 1; //结算状态
                arr.shutup = 1; //闭关状态
                arr.working = 1; //降妖状态
                arr.power_up = 1; //渡劫状态
                arr.Place_action = 1; //秘境
                arr.Place_actionplus = 1; //沉迷状态
                arr.end_time = new Date().getTime(); //结束的时间也修改为当前时间
                delete arr.group_id; //结算完去除group_id
                await redis.set(
                    'xiuxian:player:' + player_id + ':action',
                    JSON.stringify(arr)
                );
            }
        }
        e.reply('行动结束！');
    }

    async relieve(e) {
        //主人判断
        if (!e.isMaster) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        //没有at信息直接返回,不执行
        let isat = e.message.some(item => item.type === 'at');
        if (!isat) {
            return;
        }
        //获取at信息
        let atItem = e.message.filter(item => item.type === 'at');
        //对方qq
        let qq = atItem[0].qq;
        //检查存档
        let ifexistplay = await existplayer(qq);
        if (!ifexistplay) {
            return;
        }
        //清除游戏状态
        await redis.set('xiuxian:player:' + qq + ':game_action', 1);
        //查询redis中的人物动作
        let action = await redis.get('xiuxian:player:' + qq + ':action');
        action = JSON.parse(action);
        //不为空，有状态
        if (action != null) {
            //把状态都关了
            let arr = action;
            arr.is_jiesuan = 1; //结算状态
            arr.shutup = 1; //闭关状态
            arr.working = 1; //降妖状态
            arr.power_up = 1; //渡劫状态
            arr.Place_action = 1; //秘境
            arr.Place_actionplus = 1; //沉迷状态
            arr.end_time = new Date().getTime(); //结束的时间也修改为当前时间
            delete arr.group_id; //结算完去除group_id
            await redis.set('xiuxian:player:' + qq + ':action', JSON.stringify(arr));
            e.reply('已解除！');
            return;
        }
        //是空的
        e.reply('不需要解除！');
        return;
    }

    async Knockdown(e) {
        //主人判断
        if (!e.isMaster) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        //没有at信息直接返回,不执行
        let isat = e.message.some(item => item.type === 'at');
        if (!isat) {
            return;
        }
        //获取at信息
        let atItem = e.message.filter(item => item.type === 'at');
        //对方qq
        let qq = atItem[0].qq;
        //检查存档
        let ifexistplay = await existplayer(qq);
        if (!ifexistplay) {
            e.reply('没存档你打个锤子！');
            return;
        }
        let player = await Read_player(qq);
        if (!isNotNull(player.power_place)) {
            e.reply('请#同步信息');
            return;
        }
        player.power_place = 1;
        e.reply('已打落凡间！');
        await Write_player(usr_qq, player);
        return;
    }
}

export async function synchronization(e) {
    if (!e.isMaster) {
        return;
    }
    e.reply('存档开始同步');
    let playerList = [];
    let files = fs
        .readdirSync(
            './plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player'
        )
        .filter(file => file.endsWith('.json'));
    for (let file of files) {
        file = file.replace('.json', '');
        playerList.push(file);
    }
    for (let player_id of playerList) {
        let usr_qq = player_id;
        let player = await data.getData('player', usr_qq);
        let najie = await Read_najie(usr_qq);
        if (!isNotNull(player.level_id)) {
            e.reply('版本升级错误！重装吧，旧版本不支持1.1.6版本之前的存档升级！');
            return;
        }
        //删
        if (isNotNull(player.境界)) {
            player.境界 = undefined;
        }
        if (isNotNull(player.基础血量)) {
            player.基础血量 = undefined;
        }
        if (isNotNull(player.基础防御)) {
            player.基础防御 = undefined;
        }
        if (isNotNull(player.基础攻击)) {
            player.基础攻击 = undefined;
        }
        if (isNotNull(player.基础暴击)) {
            player.基础暴击 = undefined;
        }
        if (isNotNull(player.now_level_id)) {
            player.now_level_id = undefined;
        }
        if (isNotNull(player.攻击强化)) {
            player.攻击强化 = undefined;
        }
        if (isNotNull(player.防御强化)) {
            player.防御强化 = undefined;
        }
        if (isNotNull(player.生命强化)) {
            player.生命强化 = undefined;
        }
        if (isNotNull(player.法球倍率)) {
            player.法球倍率 = undefined;
        }
        //补
        if (!isNotNull(najie.材料)) {
            najie.材料 = [];
        }
        if (!isNotNull(najie.草药)) {
            najie.草药 = [];
        }
        if (!isNotNull(najie.盒子)) {
            najie.盒子 = [];
        }
        if (!isNotNull(player.Physique_id)) {
            player.Physique_id = 1;
        }
        if (!isNotNull(player.血气)) {
            player.血气 = 1;
        }
        if (!isNotNull(player.功法倍率)) {
            player.功法倍率 = 0;
        }
        if (!isNotNull(player.镇妖塔层数)) {
            player.镇妖塔层数 = 0;
        }
        if (!isNotNull(player.神魄段数)) {
            player.神魄段数 = 0;
        }
        if (!isNotNull(player.魔道值)) {
            player.魔道值 = 0;
        }
        if (!isNotNull(player.linggen)) {
            player.linggen = [];
        }
        if (!isNotNull(player.linggenshow)) {
            player.linggenshow = 1;
        }
        if (!isNotNull(player.power_place)) {
            player.power_place = 1;
        }
        if (!isNotNull(player.occupation)) {
            player.occupation = [];
        }
        if (!isNotNull(player.favorability)) {
            player.favorability = 0;
        }
        if (!isNotNull(player.breakthrough)) {
            player.breakthrough = false;
        }
        if (!isNotNull(player.occupation_level)) {
            player.occupation_level = 1;
        }
        if (!isNotNull(player.id)) {
            player.id = usr_qq;
        }
        if (!isNotNull(player.攻击加成)) {
            player.攻击加成 = 0;
        }
        if (!isNotNull(player.防御加成)) {
            player.防御加成 = 0;
        }
        if (!isNotNull(player.生命加成)) {
            player.生命加成 = 0;
        }
        if (!isNotNull(najie.仙宠)) {
            najie.仙宠 = [];
        }
        if (!isNotNull(najie.仙宠口粮)) {
            najie.仙宠口粮 = [];
        }
        if (!isNotNull(player.仙宠)) {
            player.仙宠 = [];
        }
        if (!isNotNull(player.幸运)) {
            player.幸运 = 0;
        }
        if (!isNotNull(player.皮肤)) {
            player.皮肤 = 0;
        }
        if (!isNotNull(player.islucky)) {
            player.islucky = 0;
        }
        if (!isNotNull(player.sex)) {
            player.sex = 0;
        }
        // if (!isNotNull(player.辟谷丹)) {
        //     player.辟谷丹 = 0;
        // }
        if (!isNotNull(player.addluckyNo)) {
            player.addluckyNo = 0;
        }
        let i = 0;
        let action2 = await redis.get('xiuxian:player:' + usr_qq + ':pifu');
        action2 = JSON.parse(action2);
        action2 = 1;
        await redis.set('xiuxian:player:' + usr_qq + ':pifu', JSON.stringify(action2));
        let action = await redis.get('xiuxian:player:' + 10 + ':biguang');
        action = await JSON.parse(action);
        if (action == null) {
            action = [];
        }
        for (i = 0; i < action.length; i++) {
            if (action[i].qq == usr_qq) {
                break;
            }
        }
        if (i == action.length) {
            const arr = {
                biguan: 0, //闭关状态
                biguanxl: 0, //增加效率
                xingyun: 0,
                lianti: 0,
                ped: 0,
                modao: 0,
                beiyong1: 0,//ped
                beiyong2: 0,
                beiyong3: 0,
                beiyong4: 0,
                beiyong5: 0,
                qq: usr_qq,
            };
            action.push(arr);
            await redis.set(
                'xiuxian:player:' + 10 + ':biguang',
                JSON.stringify(action)
            );
        }
        if (player.仙宠.type == '幸运' && player.幸运 < player.仙宠.加成) {
            player.幸运 = player.仙宠.加成 + player.addluckyNo;
        }
        // player.仙宠.forEach(仙宠 => {
        //   if (!isNotNull(仙宠.体力)) {
        //    仙宠.体力 =
        //        data.xianchon.find(xianchon => xianchon.name === 仙宠.name).体力 ||
        //        35;
        //    }
        // });
        // najie.仙宠.forEach(仙宠 => {
        //   if (!isNotNull(仙宠.体力)) {
        //     仙宠.体力 =
        //      data.xianchon.find(xianchon => xianchon.name === 仙宠.name).体力 ||
        //      35;
        //   }
        // });
        najie.装备.forEach(装备 => {
            if (!isNotNull(装备.islockd)) {
                装备.islockd = 0;
            }
            装备.数量 = Math.floor(装备.数量);
        });
        najie.丹药.forEach(丹药 => {
            if (!isNotNull(丹药.islockd)) {
                丹药.islockd = 0;
            }
            丹药.数量 = Math.floor(丹药.数量);
        });
        najie.道具.forEach(道具 => {
            if (!isNotNull(道具.islockd)) {
                道具.islockd = 0;
            }
            道具.数量 = Math.floor(道具.数量);
        });
        najie.功法.forEach(功法 => {
            if (!isNotNull(功法.islockd)) {
                功法.islockd = 0;
            }
            功法.数量 = Math.floor(功法.数量);
        });
        najie.草药.forEach(草药 => {
            if (!isNotNull(草药.islockd)) {
                草药.islockd = 0;
            }
            草药.数量 = Math.floor(草药.数量);
        });
        najie.材料.forEach(材料 => {
            if (!isNotNull(材料.islockd)) {
                材料.islockd = 0;
            }
            材料.数量 = Math.floor(材料.数量);
        });
        najie.盒子.forEach(盒子 => {
            if (!isNotNull(盒子.islockd)) {
                盒子.islockd = 0;
            }
            盒子.数量 = Math.floor(盒子.数量);
        });
        najie.仙宠.forEach(仙宠 => {
            if (!isNotNull(仙宠.islockd)) {
                仙宠.islockd = 0;
            }
            仙宠.数量 = Math.floor(仙宠.数量);
        });
        najie.仙宠口粮.forEach(仙宠口粮 => {
            if (!isNotNull(仙宠口粮.islockd)) {
                仙宠口粮.islockd = 0;
            }
            仙宠口粮.数量 = Math.floor(仙宠口粮.数量);
        });
        //画手修复1.11产生的纳戒同名物品bug和纳戒数量为0的问题
        najie.装备 = najie.装备.filter(item => item.数量 != null || item.数量 != 0);
        najie.丹药 = najie.丹药.filter(item => item.数量 != null || item.数量 != 0);
        najie.道具 = najie.道具.filter(item => item.数量 != null || item.数量 != 0);
        najie.功法 = najie.功法.filter(item => item.数量 != null || item.数量 != 0);
        najie.草药 = najie.草药.filter(item => item.数量 != null || item.数量 != 0);
        najie.材料 = najie.材料.filter(item => item.数量 != null || item.数量 != 0);
        najie.盒子 = najie.盒子.filter(item => item.数量 != null || item.数量 != 0);
        najie.仙宠 = najie.仙宠.filter(item => item.数量 != null || item.数量 != 0);
        najie.仙宠口粮 = najie.仙宠口粮.filter(item => item.数量 != null || item.数量 != 0);
        //修
        if (!isNotNull(player.血量上限)) {
            player.血量上限 = 1;
        }
        if (!isNotNull(player.当前血量)) {
            player.血量上限 = 1;
        }
        if (!isNotNull(player.攻击)) {
            player.攻击 = 1;
        }
        if (!isNotNull(player.防御)) {
            player.防御 = 1;
        }
        if (!isNotNull(player.lunhui)) {
            player.lunhui = 0;
        }
        if (!isNotNull(player.lunhuiBH)) {
            player.lunhuiBH = 0;
        }
        if (!isNotNull(player.轮回点) || player.轮回点 > 10) {
            player.轮回点 = 10 - player.lunhui;
        }
        player.灵石 = Math.floor(player.灵石);
        //重新根据id去重置仙门
        let now_level_id = await data.Level_list.find(
            item => item.level_id == player.level_id
        ).level_id;
        if (now_level_id < 42) {
            player.power_place = 1;
        }
        for (i = 0; i < data.talent_list.length; i++) {
            if (player.灵根.name == data.talent_list[i].name) {
                player.修炼效率提升 -= player.灵根.eff;
                player.灵根 = data.talent_list[i];
                player.修炼效率提升 += player.灵根.eff;
                break;
            }
        }
        await redis.set('xiuxian:player:' + usr_qq + ':lhxueqi', 0);
        await redis.set('xiuxian:player:' + usr_qq + ':lhxigen', 0);
        //更新面板
        let equipment = await Read_equipment(usr_qq);
        if (!isNotNull(equipment.项链)) {
            equipment.项链 = data.necklace_list.find(item => item.name == "幸运儿");
            player.幸运 += data.necklace_list.find(item => item.name == "幸运儿").加成
        }
        await Write_najie(usr_qq, najie);
        await Write_player(usr_qq, player);
        await Write_equipment(usr_qq, equipment);
    }
    e.reply('存档同步结束');
    return;
}
