import plugin from '../../../../lib/plugins/plugin.js'
import { segment } from "oicq"
import data from '../../model/XiuxianData.js'
import fs from "fs"
import { Read_player, existplayer, isNotNull, Add_灵石,Add_najie_thing } from '../Xiuxian/xiuxian.js'

//本模块由(qq:1695037643)和jio佬完成
let WorldBOSSBattleCD = [];//CD
let WorldBOSSBattleLock = 0;//BOSS战斗锁，防止打架频率过高造成奖励多发
let WorldBOSSBattleUnLockTimer = 0;//防止战斗锁因意外锁死
//处理消息
export class BOSS extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'Yunzai_Bot_修仙_BOSS',
            /** 功能描述 */
            dsc: 'BOSS模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#开启散兵$',
                    fnc: 'CreateWorldBoss'
                },
                {
                    reg: '^#关闭散兵$',
                    fnc: 'DeleteWorldBoss'
                },
                {
                    reg: '^#散兵状态$',
                    fnc: 'LookUpWorldBossStatus'
                },
                {
                    reg: '^#散兵贡献榜$',
                    fnc: 'ShowDamageList'
                },
                {
                    reg: '^#讨伐散兵$',
                    fnc: 'WorldBossBattle'
                }
            ]
        })
    }


    //散兵开启指令
    async CreateWorldBoss(e) {
        if (e.isMaster) {
            if (!await BossIsAlive()) {
                if (await InitWorldBoss(e) == 0)
                    e.reply("散兵挑战开启！");
                return true;
            }
            else {
                e.reply("散兵已经存在");
                return true;
            }
        }
        else return;
    }
    //散兵结束指令
    async DeleteWorldBoss(e) {
        if (e.isMaster) {
            if (await BossIsAlive()) {
                await redis.del("Xiuxian:WorldBossStatus");
                await redis.del("Xiuxian:PlayerRecord");
                e.reply("散兵挑战关闭！");
            }
            else e.reply("散兵未开启");
        }
        else return;
    }
    //散兵状态指令
    async LookUpWorldBossStatus(e) {
        if (await BossIsAlive()) {
            let WorldBossStatusStr = await redis.get("Xiuxian:WorldBossStatus");
            if (WorldBossStatusStr != undefined) {
                let WorldBossStatus = JSON.parse(WorldBossStatusStr);
                if (WorldBossStatus != undefined) {
                    if (new Date().getTime() - WorldBossStatus.KilledTime < 43200000) {
                        let Minutes = Math.trunc((43200000 - (new Date().getTime() - WorldBossStatus.KilledTime)) / 60000);
                        e.reply(`BOSS正在刷新，请等待${Minutes}分钟`);
                        return true;
                    }
                    else if (WorldBossStatus.KilledTime != -1) {
                        if (await InitWorldBoss(e) == 0)
                            await this.LookUpWorldBossStatus(e);
                        return true;
                    }
                    let BOSSCurrentAttack = WorldBossStatus.isAngry ? Math.trunc(WorldBossStatus.Attack * 1.8) : WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.Attack * 0.6) : WorldBossStatus.Attack;
                    let BOSSCurrentDefence = WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.Defence * 0.6) : WorldBossStatus.Defence;
                    let ReplyMsg = [`----散兵状态----\n血量:${WorldBossStatus.Health}\n基础攻击:${WorldBossStatus.Attack}\n基础防御:${WorldBossStatus.Defence}\n当前攻击:${BOSSCurrentAttack}\n当前防御:${BOSSCurrentDefence}\n当前状态:`];
                    if (WorldBossStatus.isWeak) ReplyMsg.push(`虚弱(还剩${WorldBossStatus.isWeak}回合)\n温馨提示:给散兵最后一击的人可以随机获得一个物品`);
                    else if (WorldBossStatus.isAngry) ReplyMsg.push(`狂暴(还剩${WorldBossStatus.isAngry}回合)\n温馨提示:给散兵最后一击的人可以随机获得一个物品`);
                    else ReplyMsg.push("正常\n温馨提示:给散兵最后一击的人可以随机获得一个物品");
                    e.reply(ReplyMsg);
                }
                else e.reply("WorldBossStatusStr Error");
            }
            else e.reply("Redis WorldBossStatus Error");
        }
        else e.reply("散兵未开启！")
        return true;
    }
    //散兵伤害贡献榜
    async ShowDamageList(e) {
        if (await BossIsAlive()) {
            let PlayerRecord = await redis.get("Xiuxian:PlayerRecord");
            let WorldBossStatusStr = await redis.get("Xiuxian:WorldBossStatus");
            let WorldBossStatus = JSON.parse(WorldBossStatusStr);
            if (WorldBossStatus == undefined) {
                e.reply("WorldBossStatus Error");
                return true;
            }
            if (PlayerRecord == 0) {
                e.reply("还没有人挑战散兵哦~");
                return true;
            }
            let PlayerRecordJSON = JSON.parse(PlayerRecord);
            let PlayerList = await SortPlayer(PlayerRecordJSON);
            if (!PlayerRecordJSON?.Name) {
                e.reply("请等待下次散兵周本刷新后再使用本功能");
                return true;
            }
            let CurrentQQ;
            let TotalDamage = 0;
            for (let i = 0; i < (PlayerList.length <= 20 ? PlayerList.length : 20); i++)
                TotalDamage += PlayerRecordJSON.TotalDamage[PlayerList[i]];
            let msg = [
                "****散兵周本贡献排行榜****"
            ];
            for (var i = 0; i < PlayerList.length; i++) {
                if (i < 20) {
                    let Reward = Math.trunc((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage) * WorldBossStatus.Reward);
                    Reward = Reward < 10000 ? 10000 : Reward;
                    if(Reward>1000000){
                        Reward=1000000
                    }
                    msg.push("第" + `${i + 1}` + "名:\n" + `名号:${PlayerRecordJSON.Name[PlayerList[i]]}` + '\n' + `总伤害:${PlayerRecordJSON.TotalDamage[PlayerList[i]]}` + `\n${WorldBossStatus.Health == 0 ? `已得到灵石` : `预计得到灵石`}:${Reward}`);
                }
                if (PlayerRecordJSON.QQ[PlayerList[i]] == e.user_id) CurrentQQ = i + 1;
            }
            await ForwardMsg(e, msg);
            await sleep(1000);
            if (CurrentQQ != undefined)
                e.reply(`你在散兵周本贡献排行榜中排名第${CurrentQQ}，造成伤害${PlayerRecordJSON.TotalDamage[PlayerList[CurrentQQ - 1]]}，再接再厉！`);
        }
        else e.reply("散兵未开启！");
        return true;
    }
    //与散兵战斗
    async WorldBossBattle(e) {
        if (e.isPrivate) return;

        if (!await BossIsAlive()) {
            e.reply("散兵未开启！");
            return true;
        }
        let usr_qq = e.user_id;
        var Time = 2;
        let now_Time = new Date().getTime(); //获取当前时间戳
        let shuangxiuTimeout = parseInt(60000 * Time);
        let last_time = await redis.get("xiuxian:player:" + usr_qq + "BOSSCD");//获得上次的时间戳,
        last_time = parseInt(last_time);
        if (now_Time < last_time + shuangxiuTimeout) {
            let Couple_m = Math.trunc((last_time + shuangxiuTimeout - now_Time) / 60 / 1000);
            let Couple_s = Math.trunc(((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000);
            e.reply("正在CD中，" + `剩余cd:  ${Couple_m}分 ${Couple_s}秒`);
            return;
        }
        if (await data.existData("player", e.user_id)) {
            let CurrentPlayerAttributes = await data.getData("player", e.user_id);
            if (data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id < 42&&CurrentPlayerAttributes.lunhui==0) {
                e.reply("你在仙界吗");
                return true;
            }
            //if (Lilian_CD[e.user_id]) { e.reply("正在历练中"); return true; }
            let action = await redis.get("xiuxian:player:" + e.user_id + ":action");
            action = JSON.parse(action);
            if (action != null) {
                let action_end_time = action.end_time;
                let now_time = new Date().getTime();
                if (now_time <= action_end_time) {
                    let m = parseInt((action_end_time - now_time) / 1000 / 60);
                    let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
                    e.reply("正在" + action.action + "中,剩余时间:" + m + "分" + s + "秒");
                    return;
                }
            }

            if (CurrentPlayerAttributes.当前血量 <= 200000) {
                e.reply("还是先疗伤吧，别急着参战了");
                return true;
            }
            if (WorldBOSSBattleCD[e.user_id] != undefined) {
                let Seconds = Math.trunc((300000 - (new Date().getTime() - WorldBOSSBattleCD[e.user_id])) / 1000);
                if (Seconds <= 300 && Seconds >= 0) {
                    e.reply(`刚刚一战消耗了太多气力，还是先歇息一会儿吧~(剩余${Seconds}秒)`);
                    return true;
                }
            }

            let WorldBossStatusStr = await redis.get("Xiuxian:WorldBossStatus");
            let PlayerRecord = await redis.get("Xiuxian:PlayerRecord");
            if (WorldBossStatusStr == undefined) {
                e.reply("Redis WorldBossStatus Error");
                return true;
            }
            let WorldBossStatus = JSON.parse(WorldBossStatusStr);
            if (WorldBossStatus == undefined) {
                e.reply("WorldBossStatusStr Error");
                return true;
            }
            if (new Date().getTime() - WorldBossStatus.KilledTime < 43200000) {
                let Minutes = Math.trunc((43200000 - (new Date().getTime() - WorldBossStatus.KilledTime)) / 60000);
                e.reply(`散兵周本正在刷新，请等待${Minutes}分钟`);
                return true;
            }
            else if (WorldBossStatus.KilledTime != -1) {
                if (await InitWorldBoss(e) == 0)
                    await this.WorldBossBattle(e);
                return true;
            }
            if (WorldBossStatus.Health <= 0) {
                e.reply("未知错误");
                return true;
            }
            let PlayerRecordJSON, Userid;
            if (PlayerRecord == 0) {
                let QQGroup = [], DamageGroup = [], Name = [];
                QQGroup[0] = e.user_id;
                DamageGroup[0] = 0;
                Name[0] = CurrentPlayerAttributes.名号;
                PlayerRecordJSON = {
                    "QQ": QQGroup,
                    "TotalDamage": DamageGroup,
                    "Name": Name
                }
                Userid = 0;
            }
            else {
                PlayerRecordJSON = JSON.parse(PlayerRecord);
                let i;
                for (i = 0; i < PlayerRecordJSON.QQ.length; i++) {
                    if (PlayerRecordJSON.QQ[i] == e.user_id) {
                        Userid = i;
                        break;
                    }
                }
                if (Userid == undefined) {
                    PlayerRecordJSON.QQ[i] = e.user_id;
                    PlayerRecordJSON.Name[i] = CurrentPlayerAttributes.名号;
                    PlayerRecordJSON.TotalDamage[i] = 0;
                    Userid = i;
                }
            }
            let BattleFrame = 0, TotalDamage = 0, msg = [];
            let BOSSCurrentAttack = WorldBossStatus.isAngry ? Math.trunc(WorldBossStatus.Attack * 1.8) : WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.Attack * 0.7) : WorldBossStatus.Attack;
            let BOSSCurrentDefence = WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.Defence * 0.7) : WorldBossStatus.Defence;
            if (WorldBOSSBattleUnLockTimer)
                clearTimeout(WorldBOSSBattleUnLockTimer);
            SetWorldBOSSBattleUnLockTimer(e);
            if (WorldBOSSBattleLock != 0) {
                e.reply("好像有旅行者正在和散兵激战，现在去怕是有未知的凶险，还是等等吧！");
                return true;
            }
            let arr = {
                "action": "讨伐boss",//动作
                "action_time":60000,
                "Place_action": "1",//秘境状态---关闭
                "Place_actionplus": "1",//沉迷秘境状态---关闭
                "end_time": new Date().getTime() + 60000,//结束时间
            };
            await redis.set("xiuxian:player:" + e.user_id + ":action", JSON.stringify(arr));
            WorldBOSSBattleLock = 1;
            while (CurrentPlayerAttributes.当前血量 > 0 && WorldBossStatus.Health > 0) {
                let Random = Math.random();
                if (!(BattleFrame & 1)) {
                    let Player_To_BOSS_Damage = Harm(CurrentPlayerAttributes.攻击*0.85, BOSSCurrentDefence) + Math.trunc(CurrentPlayerAttributes.攻击 * CurrentPlayerAttributes.灵根.法球倍率 + CurrentPlayerAttributes.防御*0.1);
                    let SuperAttack = (Math.random() < CurrentPlayerAttributes.暴击率) ? 1.5 : 1;
                    msg.push(`第${Math.trunc(BattleFrame / 2) + 1}回合：`);
                    if (Random < 0.05 && data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id <= 28 && CurrentPlayerAttributes.攻击 < 500000) 
                    {
                        msg.push("你的气息太弱了，甚至于轻手轻脚溜到【散兵】旁边都没被它发现。你打断了他的阵法，导致【散兵】被反噬");
                        Player_To_BOSS_Damage = Math.trunc(WorldBossStatus.OriginHealth * 0.05);
                    }               
                    else if (Random < 0.25 && CurrentPlayerAttributes.攻击 >= 1500000) {
                        msg.push("你的实力超过了【散兵】的假想，【散兵】见你袭来，使用【闪影】躲掉了大部分伤害");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.3);
                    }
                    else if (Random < 0.55 && CurrentPlayerAttributes.攻击 >= 1500000) {
                        msg.push("你的实力引起了【散兵】的重视，【散兵】开启了【护身剑罡】，导致你的攻击没有太大效果");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.6);
                    }
                    else if (Random < 0.2 && CurrentPlayerAttributes.攻击 >= 1200000) {
                        msg.push("你的实力足够强大，【散兵】见你袭来不在随便应对，你的攻击效果不好");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.5);
                    }
                    else if (Random < 0.5 && CurrentPlayerAttributes.攻击 >= 1200000) {
                        msg.push("你的实力强大，【散兵】见你袭来，开启了【护身剑罡】，攻击被影响了");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.7);
                    }
                    else if (Random < 1 && CurrentPlayerAttributes.攻击 >= 2000000) {
                        msg.push("你的实力强大，【散兵】见你袭来，开启了【护身剑罡】，攻击被影响了");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.5);
                    }
                    else if (Random < 0.09 && CurrentPlayerAttributes.攻击 <= 600000) {
                        msg.push("你的实力弱小，你全意收敛气息，使用出你意外得到的“九天惊雷符”！");
                        Player_To_BOSS_Damage =999999;
                    }
                    else if (Random >= 0.92 && data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id <= 24) {
                        msg.push("你知道你的实力弱小，所以你使用了秘技【神行雷】，但是你的境界还是太低了，只发挥出来5%");
                        Player_To_BOSS_Damage =666666;
                    }
                    else if (Random < 0.5 && CurrentPlayerAttributes.攻击 <= 500000) {
                        msg.push("【散兵】见你你的实力弱小，根本没把你放心上，你的攻击有了奇效");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.5 + 100000);
                    }
                    else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("八品·鬼帝功")>-1 && BattleFrame==0) {
                        msg.push("你使用了使用【鬼剑】暴起进攻");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.1 + 100000);
                    }
                    else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("八品·八荒剑法")>-1 && BattleFrame==2) {
                        msg.push("你使用了八荒剑法【斩八荒！】");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.2);
                    }
                    else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("伪九品·第一魔功")>-1 && BattleFrame==2) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用第一魔功【噬天！】`);
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.1 + 300000);
                    }else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("伪八品·二重梦之㱬")>-1 && BattleFrame==4) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用二重梦之㱬【梦轮】`);
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.15);
                    }
                    else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("八品·心禅不灭诀")>-1 && BattleFrame==4) {
                        msg.push("你使用了心禅不灭诀【万剑归宗】");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.25);
                    } 
                    else if (CurrentPlayerAttributes.灵根.name==="轮回道体"&& BattleFrame==0) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了先天神通，轮回之力需要时间准备`);
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.8);
                    }                     
                    else if (CurrentPlayerAttributes.灵根.name==="轮回道体"&& BattleFrame==4) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了先天神通，轮回之力崩泄而出！`);
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.5);
                    }
                    else if (CurrentPlayerAttributes.灵根.name==="灭道杀神体"&& BattleFrame==12) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了先天神通 【杀破神】！`);
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 3);
                    }
                    else if (Random < 0.11) {
                        msg.push("你等了许久，终于【散兵】疲劳，露出了破绽，你飞杀而去，但是【散兵】使用了【混元】！！你的伤害被吸收了！");
                        Player_To_BOSS_Damage = -250000;
                    }                                                         
                    else if (Random >= 0.95) {
                        msg.push("你看到【散兵】一瞬间的破绽，放出强大剑技！痛击BOSS！");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 3);
                    }
                    else if (Random >= 0.89) {
                        msg.push("你如老猎人般屏息观察，终于看准【散兵】身法中的一处缺陷，瞄准后用力一刺，正中其要害之处。");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 2);
                    }
                    else if (Random >= 0.82) {
                        msg.push("你瞄了许久，看准时机放出一道凌厉剑气，结果【散兵】使用了【幻剑】，你一头雾水");
                        Player_To_BOSS_Damage = 0;
                    }
                    else if (Random >= 0 && CurrentPlayerAttributes.攻击 >= 1500000) {
                        msg.push("【散兵】认可你的实力，【散兵】认真对待你，你不再能轻易攻击");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.7);
                    }
                    Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * SuperAttack + Math.random()*30);
                    WorldBossStatus.Health -= Player_To_BOSS_Damage;
                    TotalDamage += Player_To_BOSS_Damage;
                    if (WorldBossStatus.Health < 0) { WorldBossStatus.Health = 0 }
                    msg.push(`${CurrentPlayerAttributes.名号}${ifbaoji(SuperAttack)}造成伤害${Player_To_BOSS_Damage}，散兵剩余血量${WorldBossStatus.Health}`);
                }
                else {
                    let BOSS_To_Player_Damage = Harm(BOSSCurrentAttack, Math.trunc(CurrentPlayerAttributes.防御 * 0.1));
                    if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("八品·避空")>-1 && BattleFrame==4) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了避空【遁空！】`);
                        BOSS_To_Player_Damage *= 0.5;
                    }
                    else if (Random < 0.02 &&CurrentPlayerAttributes.灵根.type==="转生") {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了转生神通【轮墓】！你的伤害无法生效！`);
                        BOSS_To_Player_Damage = 0;
                    }
                    else if (Random < 0.05) {
                        msg.push("【散兵】使用了超上古功法【唱，跳，rap】你被不知名的球体差点打的形神具灭");
                        BOSS_To_Player_Damage = 9999999999;
                    }
                    else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("八品·桃花神功")>-1 && BattleFrame==5 && Random > 0.66) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了【三生桃花！】让攻击慢慢变成了漫天桃花飞舞。`);
                        BOSS_To_Player_Damage *= -0.2;
                    }
                    else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("伪九品·魔帝功")>-1 && BattleFrame==3 && Random > 0.50) {
                        msg.push(`${CurrentPlayerAttributes.名号} 用了魔帝功【吞噬】吸收了伤害变成自己的血量`);
                        BOSS_To_Player_Damage *= -0.1;
                    }
                    else if (Random < 0.06) {
                        msg.push("【散兵】使用【流云剑法】，刚刚好你学过一门功法可以克制。");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.3);
                    }
                    else if (Random < 0.15) {
                        msg.push("【散兵】使用了绝技【开天】");
                        BOSS_To_Player_Damage = 4000000;
                    }
                    else if (Random < 0.25) {
                        msg.push("【散兵】使用了【葬天剑】，这招你感受到了恐怖的能量，不过还好速度不快，但也稍受波及。");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.3);
                    }
                    else if (Random < 0.3) {
                        msg.push("【散兵】释放领域，你无法再动，结结实实吃了一记。");
                        BOSS_To_Player_Damage = 2500000;
                    }
                    else if (Random < 0.4) {
                        msg.push("【散兵】释放技能【灭灵剑】");
                        BOSS_To_Player_Damage = 3000000;
                    }
                    else if (Random >= 0.8) {
                        msg.push("【散兵】释放技能【流云乱剑】");
                        BOSS_To_Player_Damage = 20000000;
                    }
                    else if (Random >= 0.7) {
                        msg.push("【散兵】释放技能【乱剑冢】");
                        BOSS_To_Player_Damage = 1600000;
                    }
                    else if (Random >= 0.4) {
                        msg.push("【散兵】向你斩出一剑");
                        BOSS_To_Player_Damage = 1000000;
                    }
                    CurrentPlayerAttributes.当前血量 -= BOSS_To_Player_Damage;
                    WorldBossStatus.isAngry ? --WorldBossStatus.isAngry : 0;
                    WorldBossStatus.isWeak ? --WorldBossStatus.isWeak : 0;
                    if (!WorldBossStatus.isAngry && BOSSCurrentAttack > WorldBossStatus.Attack) BOSSCurrentAttack = WorldBossStatus.Attack;
                    if (!WorldBossStatus.isWeak && BOSSCurrentDefence < WorldBossStatus.Defence) BOSSCurrentDefence = WorldBossStatus.Defence;
                    if (CurrentPlayerAttributes.当前血量 < 0) { CurrentPlayerAttributes.当前血量 = 0 }
                    msg.push(`散兵攻击了${CurrentPlayerAttributes.名号}，造成伤害${BOSS_To_Player_Damage}，${CurrentPlayerAttributes.名号}剩余血量${CurrentPlayerAttributes.当前血量}`);
                }
                if (CurrentPlayerAttributes.当前血量 == 0 || WorldBossStatus.Health == 0)
                    break;
                BattleFrame++;
            }

            if (msg.length <= 30)
                await ForwardMsg(e, msg);
            else {
                msg.length = 30;
                await ForwardMsg(e, msg);
                e.reply("战斗过长，仅展示部分内容");
            }
            await sleep(1000);
            e.reply([`${CurrentPlayerAttributes.名号}攻击了散兵，造成伤害${TotalDamage}，散兵剩余血量${WorldBossStatus.Health}`]);
            await sleep(1000);
            if (TotalDamage >= 0.05 * WorldBossStatus.OriginHealth && !WorldBossStatus.isWeak && !WorldBossStatus.isAngry) {
                WorldBossStatus.isAngry = 30;
                e.reply("这场战斗重创了散兵，但也令其躁动不安而进入狂暴模式！\n散兵攻击获得强化，持续30回合");
            }
            if (!WorldBossStatus.isAngry && !WorldBossStatus.isWeak && Math.random() < BattleFrame * 0.015) {
                WorldBossStatus.isWeak = 30;
                e.reply("BOSS不知是不是缺乏睡眠，看起来它好像虚弱了很多。\n散兵攻击、防御降低，持续30回合");
            }
            if (CurrentPlayerAttributes.当前血量 == 0) {
                e.reply("很可惜您未能击败散兵，反而自身重伤，再接再厉！");
                if (Math.random() < BattleFrame * 0.025) {
                    let ExpFormBOSS = 1000 + data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id * 210;
                    e.reply(`你在与散兵的打斗中突然对其招式有所领悟，修为提升${ExpFormBOSS}`);
                    CurrentPlayerAttributes.修为 += ExpFormBOSS;
                }
                if (Math.random() < BattleFrame * 0.025) {
                    let HPFormBOSS = 5000 + CurrentPlayerAttributes.血量上限 * 0.2;
                    if (HPFormBOSS > CurrentPlayerAttributes.血量上限) HPFormBOSS = CurrentPlayerAttributes.血量上限 - CurrentPlayerAttributes.当前血量;
                    HPFormBOSS = Math.trunc(HPFormBOSS);
                    e.reply(`虽然你被锤得半死不活，但是却因此通了气血，生命恢复${HPFormBOSS}点`);
                    CurrentPlayerAttributes.当前血量 += HPFormBOSS;
                }
            }
            await sleep(1000);
            PlayerRecordJSON.TotalDamage[Userid] += TotalDamage;
            redis.set("Xiuxian:PlayerRecord", JSON.stringify(PlayerRecordJSON));
            await data.setData("player", e.user_id, CurrentPlayerAttributes);
            redis.set("Xiuxian:WorldBossStatus", JSON.stringify(WorldBossStatus));
            //记录cd
            await redis.set("xiuxian:player:" + usr_qq + "BOSSCD", now_Time);
            if (WorldBossStatus.Health == 0) {
                e.reply("散兵被击杀！玩家们可以根据贡献获得奖励！");
                await sleep(1000);

                var a
                var z=1
                var weizhi=data.sanbin
                a = Math.floor(Math.random() * (weizhi.length));
                await Add_najie_thing(e.user_id,weizhi[a].name,weizhi[a].class,z)

                e.reply([segment.at(e.user_id),"\n恭喜你亲手结果了散兵的性命,为民除害，额外获得100000灵石奖励！并在散兵身上翻到了"+weizhi[a].name+"!"]);
                CurrentPlayerAttributes.灵石 += 100000;
                Bot.logger.mark(`[散兵] 结算:${e.user_id}增加奖励100000`);
                await data.setData("player", e.user_id, CurrentPlayerAttributes);
                let action = await redis.get("xiuxian:player:" + e.user_id + ":action");
                action = await JSON.parse(action);
                action.end_time = new Date().getTime();
                await redis.set("xiuxian:player:" + e.user_id + ":action", JSON.stringify(action));
                WorldBossStatus.KilledTime = new Date().getTime();
                redis.set("Xiuxian:WorldBossStatus", JSON.stringify(WorldBossStatus));
                let PlayerList = await SortPlayer(PlayerRecordJSON);
                e.reply("正在进行存档有效性检测，如果长时间没有回复请联系主人修复存档并手动按照贡献榜发放奖励");
                for (let i = 0; i < PlayerList.length; i++)
                    await data.getData("player", PlayerRecordJSON.QQ[PlayerList[i]]);
                let Show_MAX;
                let Rewardmsg = [
                    "****散兵周本贡献排行榜****"
                ];
                if (PlayerList.length > 20) Show_MAX = 20;
                else Show_MAX = PlayerList.length;
                let TotalDamage = 0;
                for (let i = 0; i < (PlayerList.length <= 20 ? PlayerList.length : 20); i++)
                    TotalDamage += PlayerRecordJSON.TotalDamage[PlayerList[i]];
                for (var i = 0; i < PlayerList.length; i++) {
                    let CurrentPlayer = await data.getData("player", PlayerRecordJSON.QQ[PlayerList[i]]);
                    if (i < Show_MAX) {
                        let Reward = Math.trunc((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage) * WorldBossStatus.Reward);
                        Reward = Reward < 1500 ? 1500 : Reward;
                        if(Reward>1000000){
                            e.reply("由于获利过多，被万仙盟收取了税费，剩下100w")
                            Reward=1000000
                        }
                        Rewardmsg.push("第" + `${i + 1}` + "名:\n" + `名号:${CurrentPlayer.名号}` + '\n' + `伤害:${PlayerRecordJSON.TotalDamage[PlayerList[i]]}` + '\n' + `获得灵石奖励${Reward}`);
                        CurrentPlayer.灵石 += Reward;
                        await data.setData("player", PlayerRecordJSON.QQ[PlayerList[i]], CurrentPlayer);
                        Bot.logger.mark(`[散兵周本] 结算:${PlayerRecordJSON.QQ[PlayerList[i]]}增加奖励${Reward}`);
                        continue;
                    }
                    else {
                        CurrentPlayer.灵石 += 150000;
                        Bot.logger.mark(`[散兵周本] 结算:${PlayerRecordJSON.QQ[PlayerList[i]]}增加奖励150000`);
                        await data.setData("player", PlayerRecordJSON.QQ[PlayerList[i]], CurrentPlayer);
                    }
                    if (i == PlayerList.length - 1) Rewardmsg.push("其余参与的修仙者均获得15000灵石奖励！");
                }
                await ForwardMsg(e, Rewardmsg);
            }
            WorldBOSSBattleCD[e.user_id] = new Date().getTime();
            WorldBOSSBattleLock = 0;
            return true;
        }
        else {
            e.reply("区区凡人，也想参与此等战斗中吗？");
            return true;
        }
    }
}

//初始化散兵
async function InitWorldBoss(e) {
    let AverageDamageStruct = await GetAverageDamage();
    let player_quantity = parseInt(AverageDamageStruct.player_quantity);
    let AverageDamage = parseInt(AverageDamageStruct.AverageDamage);
    let fairyNums = parseInt(AverageDamageStruct.fairy_nums);
    WorldBOSSBattleLock = 0;
    if (player_quantity == 0) {
        e.reply("你们甚至没有化神以上的高手，散兵不是你们能染指的，继续努力再来吧！");
        return -1;
    }
    if (player_quantity < 4) {
        e.reply("天道:发现人数过少，正在进行削弱");
        player_quantity=1
    }
    let X = AverageDamage * 0.01;
    Bot.logger.mark(`[散兵] 化神玩家总数：${player_quantity}`);
    Bot.logger.mark(`[散兵] 生成基数:${X}`);
    let Health = Math.trunc(X * 500 * player_quantity*2);//血量要根据人数来
    let Attack = Math.trunc(X * 120);
    let Defence = Math.trunc(X);
    let Reward = Math.trunc(X * (fairyNums > 7 ? 2 : 4) * (player_quantity > 20 ? 20 : player_quantity));
    let WorldBossStatus = {
        "Health": Health,
        "OriginHealth": Health,
        "isAngry": 0,
        "isWeak": 0,
        "Attack": Attack,
        "Defence": Defence,
        "KilledTime": -1,
        "Reward": Reward * 5,
    };
    let PlayerRecord = 0;
    await redis.set("Xiuxian:WorldBossStatus", JSON.stringify(WorldBossStatus));
    await redis.set("Xiuxian:PlayerRecord", JSON.stringify(PlayerRecord));
    return 0;
}

//获取散兵是否已开启
async function BossIsAlive() {
    return (await redis.get("Xiuxian:WorldBossStatus") && await redis.get("Xiuxian:PlayerRecord"));
}

//排序
async function SortPlayer(PlayerRecordJSON) {
    if (PlayerRecordJSON) {
        let Temp0 = JSON.parse(JSON.stringify(PlayerRecordJSON));
        let Temp = Temp0.TotalDamage;
        let SortResult = [];
        Temp.sort(function (a, b) { return b - a });
        for (let i = 0; i < PlayerRecordJSON.TotalDamage.length; i++) {
            for (let s = 0; s < PlayerRecordJSON.TotalDamage.length; s++) {
                if (Temp[i] == PlayerRecordJSON.TotalDamage[s]) {
                    SortResult[i] = s;
                    break;
                }
            }
        }
        return SortResult;
    }
}
//设置防止锁卡死的计时器
async function SetWorldBOSSBattleUnLockTimer(e) {
    WorldBOSSBattleUnLockTimer = setTimeout(() => {
        if (WorldBOSSBattleLock == 1) {
            WorldBOSSBattleLock = 0;
            e.reply("检测到战斗锁卡死，已自动修复");
            return true;
        }
    }, 30000);
}

//sleep
async function sleep(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    })
}

//发送转发消息
//输入data一个数组,元素是字符串,每一个元素都是一条消息.
async function ForwardMsg(e, data) {
    //Bot.logger.mark(data);
    let msgList = [];
    for (let i of data) {
        msgList.push({
            message: i,
            nickname: Bot.nickname,
            user_id: Bot.uin,
        });
    }
    if (msgList.length == 1) {
        await e.reply(msgList[0].message);
    }
    else {
        //console.log(msgList);
        await e.reply(await Bot.makeForwardMsg(msgList));
    }
    return;
}

//通过暴击伤害返回输出用的文本
function ifbaoji(baoji) {
    if (baoji == 1) { return ""; }
    else { return '触发暴击，'; }
}

//攻击攻击防御计算伤害
function Harm(atk, def) {
    let x;
    let s = atk / def;
    let rand = Math.trunc(Math.random() * 11) / 100 + 0.95;//保留±5%的伤害波动
    if (s < 1) {
        x = 0.1;
    }
    else if (s > 2.5) {
        x = 1;
    }
    else {
        x = 0.6 * s - 0.5;
    }
    x = Math.trunc(x * atk * rand);
    return x;
}

//获取玩家平均实力和化神以上人数
async function GetAverageDamage() {
    let File = fs.readdirSync(data.filePathMap.player);
    File = File.filter(file => file.endsWith(".json"));
    let temp = [];
    let fairyNums = 0;
    let TotalPlayer = 0;
    for (var i = 0; i < File.length; i++) {
        let this_qq = File[i].replace(".json", '');
        this_qq = parseInt(this_qq);
        let player = await data.getData("player", this_qq);
        let level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
        if (level_id >= 17) {
            temp[TotalPlayer] = parseInt(player.攻击);
            Bot.logger.mark(`[散兵] ${this_qq}玩家攻击:${temp[TotalPlayer]}`);
            TotalPlayer++;
        }
        if(level_id > 33){
            fairyNums++;
        }
    }
    //排序
    temp.sort(function (a, b) { return b - a });
    let AverageDamage = 0;
    if (TotalPlayer > 15) for (let i = 2; i < temp.length - 4; i++)
        AverageDamage += temp[i];
    else for (let i = 0; i < temp.length; i++)
        AverageDamage += temp[i];
    AverageDamage = TotalPlayer > 15 ? AverageDamage / (temp.length - 6) : (temp.length == 0 ? 0 : (AverageDamage / temp.length));
    let res = {
        "AverageDamage": AverageDamage,
        "player_quantity": TotalPlayer,
        "fairy_nums": fairyNums
    }
    return res;
}
