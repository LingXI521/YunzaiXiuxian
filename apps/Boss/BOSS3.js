import plugin from '../../../../lib/plugins/plugin.js'
import { segment } from "oicq"
import data from '../../model/XiuxianData.js'
import fs from "fs"
import { Gaodenyuansulun,Add_najie_thing,anti_cheating, isNotNull } from '../Xiuxian/xiuxian.js'
import config from "../../model/Config.js"

//本模块由(qq:1695037643)和jio佬完成
let WorldBOSSBattleCD = [];//CD
let WorldBOSSBattleLock = 0;//BOSS战斗锁，防止打架频率过高造成奖励多发
let WorldBOSSBattleUnLockTimer = 0;//防止战斗锁因意外锁死
//处理消息
export class BOSS3 extends plugin {
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
                    reg: '^#开启初夏$',
                    fnc: 'CreateWorldBoss'
                },
                {
                    reg: '^#关闭初夏$',
                    fnc: 'DeleteWorldBoss'
                },
                {
                    reg: '^#初夏状态$',
                    fnc: 'LookUpWorldBossStatus'
                },
                {
                    reg: '^#初夏贡献榜$',
                    fnc: 'ShowDamageList'
                },
                {
                    reg: '^#讨伐初夏$',
                    fnc: 'WorldBossBattle'
                }
            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }


    //初夏开启指令
    async CreateWorldBoss(e) {
        if (!e.isMaster) {
            return
        }

        await InitWorldBoss()
        e.reply("强制开启成功")
        return;
    }
    //初夏结束指令
    async DeleteWorldBoss(e) {
        if (!e.isMaster) {
            return
        }
        if (await BossIsAlive()) {
            await redis.del("Xiuxian:WorldBossStatus3");
            await redis.del("Xiuxian:PlayerRecord3");
        }
        e.reply("强制关闭成功")
        return ;
    }
    //初夏状态指令
    async LookUpWorldBossStatus(e) {
        if (await BossIsAlive()) {
            let WorldBossStatusStr = await redis.get("Xiuxian:WorldBossStatus3");
            if (WorldBossStatusStr != undefined) {
                let WorldBossStatus = JSON.parse(WorldBossStatusStr);
                if (WorldBossStatus != undefined) {
                    if (new Date().getTime() - WorldBossStatus.KilledTime < 1) {
                        e.reply(`BOSS正在刷新，晚上8点开启`);
                        return true;
                    }else if (WorldBossStatus.KilledTime != -1) {
                        if (await InitWorldBoss(e) == 0)
                            await this.LookUpWorldBossStatus(e);
                        return true;
                    }
                    let BOSSCurrentAttack = WorldBossStatus.isAngry ? Math.trunc(WorldBossStatus.攻击 * 1.2) : WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.攻击 ) : WorldBossStatus.攻击;
                    let BOSSCurrentDefence = WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.防御 * 0.8) : WorldBossStatus.防御;
                    let ReplyMsg = [`----初夏状态----\n血量:${WorldBossStatus.当前血量}\n基础攻击:${WorldBossStatus.攻击}\n基础防御:${WorldBossStatus.防御}\n当前攻击:${BOSSCurrentAttack}\n当前防御:${BOSSCurrentDefence}\n当前状态:`];
                    if (WorldBossStatus.isWeak) ReplyMsg.push(`虚弱(还剩${WorldBossStatus.isWeak}回合)`);
                    else if (WorldBossStatus.isAngry) ReplyMsg.push(`狂暴(还剩${WorldBossStatus.isAngry}回合)`);
                    else ReplyMsg.push("正常");
                    e.reply(ReplyMsg);
                }
                else e.reply("WorldBossStatusStr Error");
            }
            else e.reply("Redis WorldBossStatus Error");
        }
        else e.reply("初夏未开启！")
        return true;
    }
    //初夏伤害贡献榜
    async ShowDamageList(e) {
        if (await BossIsAlive()) {
            let PlayerRecord = await redis.get("Xiuxian:PlayerRecord3");
            let WorldBossStatusStr = await redis.get("Xiuxian:WorldBossStatus3");
            let WorldBossStatus = JSON.parse(WorldBossStatusStr);
            if (WorldBossStatus == undefined) {
                e.reply("WorldBossStatus Error");
                return true;
            }
            if (PlayerRecord == 0) {
                e.reply("还没有人挑战初夏哦~");
                return true;
            }
            let PlayerRecordJSON = JSON.parse(PlayerRecord);
            let PlayerList = await SortPlayer(PlayerRecordJSON);
            if (!PlayerRecordJSON?.Name) {
                e.reply("请等待下次初夏副本刷新后再使用本功能");
                return true;
            }
            let CurrentQQ;
            let TotalDamage = 0;
            for (let i = 0; i < (PlayerList.length <= 20 ? PlayerList.length : 20); i++)
                TotalDamage += PlayerRecordJSON.TotalDamage[PlayerList[i]];
            let msg = [
                "****初夏副本贡献排行榜****"
            ];
            for (var i = 0; i < PlayerList.length; i++) {
                if (i < 20) {
                        let Reward;
                        if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.025)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.06);
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.05)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.045);
                            if (Reward<Math.trunc(TotalDamage*0.025*0.06))
                            {
                                Reward=Math.trunc(TotalDamage*0.025*0.06);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.075)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.036);
                            if (Reward<Math.trunc(TotalDamage*0.05*0.045))
                            {
                                Reward=Math.trunc(TotalDamage*0.05*0.045);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.1)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.032);
                            if (Reward<Math.trunc(TotalDamage*0.075*0.036))
                            {
                                Reward=Math.trunc(TotalDamage*0.075*0.036);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.15)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.025);
                            if (Reward<Math.trunc(TotalDamage*0.1*0.032))
                            {
                                Reward=Math.trunc(TotalDamage*0.1*0.032);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.2)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.022);
                            if (Reward<Math.trunc(TotalDamage*0.15*0.025))
                            {
                                Reward=Math.trunc(TotalDamage*0.15*0.025);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.3)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.018);
                            if (Reward<Math.trunc(TotalDamage*0.2*0.022))
                            {
                                Reward=Math.trunc(TotalDamage*0.2*0.022);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.4)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.016);
                            if (Reward<Math.trunc(TotalDamage*0.3*0.018))
                            {
                                Reward=Math.trunc(TotalDamage*0.3*0.018);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.5)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.015);
                            if (Reward<Math.trunc(TotalDamage*0.4*0.016))
                            {
                                Reward=Math.trunc(TotalDamage*0.4*0.016);
                            }
                        }
                        else
                        {
                            Reward=Math.trunc(TotalDamage*0.5*0.015);
                        }
                        if (TotalDamage>120000000)
                        {
                            Reward=Math.trunc(Reward/(TotalDamage/120000000));
                        }
                        if (Reward<100000)
                        {
                            Reward=100000;
                        }
                    msg.push("第" + `${i + 1}` + "名:\n" + `名号:${PlayerRecordJSON.Name[PlayerList[i]]}` + '\n' + `总伤害:${PlayerRecordJSON.TotalDamage[PlayerList[i]]}` + `\n${WorldBossStatus.当前血量 == 0 ? `已得到灵石` : `预计得到灵石`}:${Reward}`);
                }
                if (PlayerRecordJSON.QQ[PlayerList[i]] == e.user_id) CurrentQQ = i + 1;
            }
            await ForwardMsg(e, msg);
            await sleep(1000);
            if (CurrentQQ != undefined)
                e.reply(`你在初夏副本贡献排行榜中排名第${CurrentQQ}，造成伤害${PlayerRecordJSON.TotalDamage[PlayerList[CurrentQQ - 1]]}，再接再厉！`);
        }
        else e.reply("初夏未开启！");
        return true;
    }
    //与初夏战斗
    async WorldBossBattle(e) {
        if (e.isPrivate) return;

        if (!await BossIsAlive()) {
            e.reply("初夏未开启！");
            return true;
        }

        if (await data.existData("player", e.user_id)) {
            let CurrentPlayerAttributes = await data.getData("player", e.user_id);
            if (data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id < 22) {
                e.reply("修为至少达到化神初期才能参与挑战");
                return true;
            }

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
            let jiansuo=await anti_cheating(e)
            if(!jiansuo){
                e.reply("您刚降临到这方世界，还与此次活动的重要NPC未曾有过面缘")
                return
            }
         if (WorldBOSSBattleCD[e.user_id] != undefined) {
                let Seconds = Math.trunc((300000 - (new Date().getTime() - WorldBOSSBattleCD[e.user_id])) / 1000);
                if (Seconds <= 300 && Seconds >= 0) {
                    e.reply(`刚刚一战消耗了太多气力，还是先歇息一会儿吧~(剩余${Seconds}秒)`);
                    return true;
                }
            }

            let WorldBossStatusStr = await redis.get("Xiuxian:WorldBossStatus3");
            let PlayerRecord = await redis.get("Xiuxian:PlayerRecord3");
            if (WorldBossStatusStr == undefined) {
                e.reply("Redis WorldBossStatus Error");
                return true;
            }
            let WorldBossStatus = JSON.parse(WorldBossStatusStr);
            if (WorldBossStatus == undefined) {
                e.reply("WorldBossStatusStr Error");
                return true;
            }
            if (new Date().getTime() - WorldBossStatus.KilledTime < 1) {
                let Minutes = Math.trunc((43200000 - (new Date().getTime() - WorldBossStatus.KilledTime)) / 60000);
                e.reply(`BOSS正在刷新，晚上8点开启`);
                return true;
            }
            if (WorldBossStatus.当前血量 <= 0) {
                e.reply("初夏正在被封印中....");
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
            let BOSSCurrentAttack = WorldBossStatus.isAngry ? Math.trunc(WorldBossStatus.攻击 * 1.2) : WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.攻击 ) : WorldBossStatus.攻击;
            let BOSSCurrentDefence = WorldBossStatus.isWeak ? Math.trunc(WorldBossStatus.防御 * 0.8) : WorldBossStatus.防御;
            if (WorldBOSSBattleUnLockTimer)
                clearTimeout(WorldBOSSBattleUnLockTimer);
            SetWorldBOSSBattleUnLockTimer(e);
            if (WorldBOSSBattleLock != 0) {
                e.reply("好像有旅行者正在和初夏激战，现在去怕是有未知的凶险，还是等等吧！");
                return true;
            }
            let arr = {
                "action": "讨伐boss",//动作
                "Place_action": "1",//秘境状态---关闭
                "Place_actionplus": "1",//沉迷秘境状态---关闭
                "action_time":60000,
                "end_time": new Date().getTime() + 60000,//结束时间
            };
            await redis.set("xiuxian:player:" + e.user_id + ":action", JSON.stringify(arr));
            WorldBOSSBattleLock = 1;
            let afangyu=CurrentPlayerAttributes.防御//记录A原防御
            let bfangyu=WorldBossStatus.防御//记录B原防御
            let aATK=CurrentPlayerAttributes.攻击//记录A原攻击
            let bATK=WorldBossStatus.攻击//记录B原攻击
            let Agandianhuihe=0;//感电燃烧回合数
            let Bgandianhuihe=0;//感电燃烧回合数
            let Achaodaohuihe=0;//超导回合数
            let Bchaodaohuihe=0;//超导回合数
            while (CurrentPlayerAttributes.当前血量 > 0 && WorldBossStatus.当前血量 > 0) {
                let Random = Math.random();
                if (!(BattleFrame & 1)) {
                    let 持续伤害=0
                    let yuansu=await Gaodenyuansulun(CurrentPlayerAttributes,WorldBossStatus,aATK,msg,BattleFrame,Agandianhuihe,Achaodaohuihe)
                    Agandianhuihe=yuansu.gandianhuihe
                    Achaodaohuihe=yuansu.chaodaohuihe2
                    CurrentPlayerAttributes=yuansu.A_player
                    WorldBossStatus=yuansu.B_player
        
                    if(yuansu.chaodao&&Achaodaohuihe>0){
                        Achaodaohuihe-=1
                        msg.push(WorldBossStatus.名号+"的抗性大大下降,虚弱状态剩余"+Achaodaohuihe+"回合")
                        WorldBossStatus.防御*=0.5
                    }
        
                    if(yuansu.fyjiachen!=0){
                       CurrentPlayerAttributes.防御+=yuansu.fyjiachen
                    }
                    msg=yuansu.msg
                    let Player_To_BOSS_Damage = Harm(CurrentPlayerAttributes.攻击*0.85, BOSSCurrentDefence) + Math.trunc(CurrentPlayerAttributes.攻击 * CurrentPlayerAttributes.灵根.法球倍率 + CurrentPlayerAttributes.防御*0.1);
                    let SuperAttack = (Math.random() < CurrentPlayerAttributes.暴击率) ? 1.5 : 1;
                    msg.push(`第${Math.trunc(BattleFrame / 2) + 1}回合：`);
                    if (Random < 0.05 && data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id <= 28 && CurrentPlayerAttributes.攻击 < 3000000) 
                    {
                        msg.push("你的气息太弱了，甚至于轻手轻脚溜到【初夏】旁边都没被它发现。你打断了他的阵法，导致【初夏】被反噬");
                        Player_To_BOSS_Damage = Math.trunc(WorldBossStatus.血量上限 * 0.05);
                    }
                    else if (Random < 0.25 && CurrentPlayerAttributes.攻击 >= 5000000) {
                        msg.push("你的实力超过了【初夏】的假想，【初夏】见你袭来，使用【闪影】躲掉了大部分伤害");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.3);
                    }
                    else if (Random < 0.55 && CurrentPlayerAttributes.攻击 >= 5000000) {
                        msg.push("你的实力引起了【初夏】的重视，【初夏】开启了【护身剑罡】，导致你的攻击没有太大效果");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.6);
                    }
                    else if (Random < 0.2 && CurrentPlayerAttributes.攻击 >= 5000000) {
                        msg.push("你的实力足够强大，【初夏】见你袭来不在随便应对，你的攻击效果不好");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.5);
                    }
                    else if (Random < 0.5 && CurrentPlayerAttributes.攻击 >= 5000000) {
                        msg.push("你的实力强大，【初夏】见你袭来，开启了【护身剑罡】，攻击被影响了");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.7);
                    }
                    else if (Random < 1 && CurrentPlayerAttributes.攻击 >= 5000000) {
                        msg.push("你的实力强大，【初夏】见你袭来，开启了【护身剑罡】，攻击被影响了");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.5);
                    }
                    else if (Random < 0.09 && CurrentPlayerAttributes.攻击 <= 2000000) {
                        msg.push("你的实力弱小，你全意收敛气息，使用出你意外得到的“九天惊雷符”！");
                        Player_To_BOSS_Damage =Math.trunc(Player_To_BOSS_Damage * 5);;
                    }
                    else if (Random >= 0.92 && data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id <= 35) {
                        msg.push("你知道你的实力弱小，所以你使用了秘技【神行雷】，但是你的境界还是太低了，只发挥出来5%");
                        Player_To_BOSS_Damage =Math.trunc(Player_To_BOSS_Damage * 3);
                    }
                    else if (Random < 0.5 && CurrentPlayerAttributes.攻击 <= 500000) {
                        msg.push("【初夏】见你你的实力弱小，根本没把你放心上，你的攻击有了奇效");
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
                        msg.push("你等了许久，终于【初夏】疲劳，露出了破绽，你飞杀而去，但是【初夏】使用了【混元】！！你的伤害被吸收了！");
                        Player_To_BOSS_Damage = -250000;
                    }                                                         
                    else if (Random >= 0.95) {
                        msg.push("你看到【初夏】一瞬间的破绽，放出强大剑技！痛击BOSS！");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 3);
                    }
                    else if (Random >= 0.89) {
                        msg.push("你如老猎人般屏息观察，终于看准【初夏】身法中的一处缺陷，瞄准后用力一刺，正中其要害之处。");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 2);
                    }
                    else if (Random >= 0.82) {
                        msg.push("你瞄了许久，看准时机放出一道凌厉剑气，结果【初夏】使用了【幻剑】，你一头雾水");
                        Player_To_BOSS_Damage *= 0.5;
                    }
                    else if (Random >= 0 && CurrentPlayerAttributes.攻击 >= 1500000) {
                        msg.push("【初夏】认可你的实力，【初夏】认真对待你，你不再能轻易攻击");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.7);
                    }
                    WorldBossStatus.防御=bfangyu
                    Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * SuperAttack + Math.random()*30);
                    if(yuansu.ranshao&&Agandianhuihe>0){
                        持续伤害=Math.trunc(Player_To_BOSS_Damage*0.15)
                        Agandianhuihe-=1
                        WorldBossStatus.当前血量-=持续伤害
                        msg.push(WorldBossStatus.名号+"烧了起来,受到了"+持续伤害+"的燃烧伤害")
                        
                    }
                    if(yuansu.gandian&&Agandianhuihe>0){
                        持续伤害=Math.trunc(Player_To_BOSS_Damage*0.15)
                        Agandianhuihe-=1
                        WorldBossStatus.当前血量-=持续伤害
                        msg.push(WorldBossStatus.名号+"触电了,受到了"+持续伤害+"的感电伤害")
                    }
                    Player_To_BOSS_Damage=Math.trunc(Player_To_BOSS_Damage);
                    if(Player_To_BOSS_Damage>WorldBossStatus.血量上限/10){
                        Player_To_BOSS_Damage=Math.trunc(WorldBossStatus.血量上限/10)
                        msg.push("你的攻击过于强大，被天地法则限制")
                    }
                    WorldBossStatus.当前血量 -= Player_To_BOSS_Damage;
                    if ((WorldBossStatus.灵根.name=="仙之心·水"&&CurrentPlayerAttributes.灵根.name=="仙之心·木") || (WorldBossStatus.灵根.name=="仙之心·木"&&CurrentPlayerAttributes.灵根.name=="仙之心·水"))
                    {
                        TotalDamage= (CurrentPlayerAttributes.攻击*0.3)+TotalDamage;
                
                    }
                    TotalDamage = Player_To_BOSS_Damage+TotalDamage+持续伤害;
                    if (WorldBossStatus.当前血量 < 0) { WorldBossStatus.当前血量 = 0 }
                    msg.push(`${CurrentPlayerAttributes.名号}${ifbaoji(SuperAttack)}造成伤害${Player_To_BOSS_Damage}，初夏剩余血量${WorldBossStatus.当前血量}`);
                    
                    //说明被冻结了
                    if (BattleFrame!=yuansu.cnt)
                    {
                        msg.push(`${WorldBossStatus.名号}冻结中`);
                        BattleFrame+=2;
                        continue;
                    }


                }
                else {
                    let 持续伤害=0
                    let yuansu=await Gaodenyuansulun(WorldBossStatus,CurrentPlayerAttributes,bATK,msg,BattleFrame,Bgandianhuihe,Bchaodaohuihe)
                    Bgandianhuihe=yuansu.gandianhuihe
                    Bchaodaohuihe=yuansu.chaodaohuihe2
                    CurrentPlayerAttributes=yuansu.B_player
                    WorldBossStatus=yuansu.A_player
                    

                    if(yuansu.chaodao&&Bchaodaohuihe>0){
                        Bchaodaohuihe-=1
                        msg.push(CurrentPlayerAttributes.名号+"的抗性大大下降,虚弱状态剩余"+Bchaodaohuihe+"回合")
                        CurrentPlayerAttributes.防御*=0.5
                    }

                    if(yuansu.fyjiachen!=0){
                        WorldBossStatus.防御+=yuansu.fyjiachen
                    }
                    msg=yuansu.msg
                    let BOSS_To_Player_Damage = Harm(BOSSCurrentAttack, Math.trunc(CurrentPlayerAttributes.防御*0.2 ));
                    if (Random < 0.015) {
                        msg.push("【初夏】使用了超上古功法【唱，跳，rap】你被不知名的球体差点打的形神具灭");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 2.2);
                    }

                    else if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("八品·避空")>-1 && BattleFrame==4) {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了避空【遁空！】`);
                        BOSS_To_Player_Damage *= 0.5;
                    }
                    else if (Random < 0.02 &&CurrentPlayerAttributes.灵根.type==="转生") {
                        msg.push(`${CurrentPlayerAttributes.名号} 使用了转生神通【轮墓】！你的伤害无法生效！`);
                        BOSS_To_Player_Damage = 0;
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
                        msg.push("【初夏】使用【流云剑法】，刚刚好你学过一门功法可以克制。");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.3);
                    }
                    else if (Random < 0.15) {
                        msg.push("【初夏】使用了绝技【开天】");
                        BOSS_To_Player_Damage *= 2.5;
                    }
                    else if (Random < 0.25) {
                        msg.push("【初夏】使用了【葬天剑】，这招你感受到了恐怖的能量，不过还好速度不快，但也稍受波及。");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.3);
                    }
                    else if (Random < 0.3) {
                        msg.push("【初夏】释放领域，你无法再动，结结实实吃了一记。");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 1.6);
                    }
                    else if (Random < 0.4) {
                        msg.push("【初夏】释放技能【灭灵剑】");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 1.4);
                    }
                    else if (Random >= 0.8) {
                        msg.push("【初夏】释放技能【流云乱剑】");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 1.2);
                    }
                    else if (Random >= 0.7) {
                        msg.push("【初夏】释放技能【乱剑冢】");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 1);
                    }
                    else {
                        msg.push("【初夏】向你斩出一剑");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.8);
                    }
                    if(yuansu.ranshao&&Bgandianhuihe>0){
                        持续伤害=Math.trunc(BOSS_To_Player_Damage*0.15)
                        Bgandianhuihe-=1
                        CurrentPlayerAttributes.当前血量-=持续伤害
                        msg.push(CurrentPlayerAttributes.名号+"烧了起来,受到了"+持续伤害+"的燃烧伤害")
                
                    }
                    if(yuansu.gandian&&Bgandianhuihe>0){
                        持续伤害=Math.trunc(BOSS_To_Player_Damage*0.15)
                        Bgandianhuihe-=1
                        CurrentPlayerAttributes.当前血量-=持续伤害
                        msg.push(CurrentPlayerAttributes.名号+"触电了,受到了"+持续伤害+"的感电伤害")
                    }
                    BOSS_To_Player_Damage=Math.trunc(BOSS_To_Player_Damage);
                    CurrentPlayerAttributes.当前血量 -= BOSS_To_Player_Damage;
                    WorldBossStatus.isAngry ? --WorldBossStatus.isAngry : 0;
                    WorldBossStatus.isWeak ? --WorldBossStatus.isWeak : 0;
                    if (!WorldBossStatus.isAngry && BOSSCurrentAttack > WorldBossStatus.攻击) BOSSCurrentAttack = WorldBossStatus.攻击;
                    if (!WorldBossStatus.isWeak && BOSSCurrentDefence < WorldBossStatus.防御) BOSSCurrentDefence = WorldBossStatus.防御;
                    if (CurrentPlayerAttributes.当前血量 < 0) { CurrentPlayerAttributes.当前血量 = 0 }
                    CurrentPlayerAttributes.防御=afangyu
                    msg.push(`初夏攻击了${CurrentPlayerAttributes.名号}，造成伤害${BOSS_To_Player_Damage}，${CurrentPlayerAttributes.名号}剩余血量${CurrentPlayerAttributes.当前血量}`);
                }
                if (CurrentPlayerAttributes.当前血量 == 0 || WorldBossStatus.当前血量 == 0)
                    break;
                    
                BattleFrame++;
            }
            CurrentPlayerAttributes.防御=afangyu
            WorldBossStatus.防御=bfangyu
            CurrentPlayerAttributes.攻击=aATK
            WorldBossStatus.攻击=bATK
            if (msg.length <= 60)
                await ForwardMsg(e, msg);
            else {
                msg.length = 60;
                await ForwardMsg(e, msg);
                e.reply("战斗过长，仅展示部分内容");
            }
            await sleep(1000);
            e.reply([`${CurrentPlayerAttributes.名号}攻击了初夏，造成伤害${TotalDamage}，初夏剩余血量${WorldBossStatus.当前血量}`]);
            await sleep(1000);
            if (TotalDamage >= 0.1 * WorldBossStatus.血量上限 && !WorldBossStatus.isWeak && !WorldBossStatus.isAngry) {
                WorldBossStatus.isAngry = 20;
                e.reply("这场战斗重创了初夏，但也令其躁动不安而进入狂暴模式！\n初夏攻击获得强化，持续20回合");
            }
            if (!WorldBossStatus.isAngry && !WorldBossStatus.isWeak && Math.random() < BattleFrame * 0.015) {
                WorldBossStatus.isWeak = 30;
                e.reply("BOSS不知是不是缺乏睡眠，看起来它好像虚弱了很多。\n初夏攻击、防御降低，持续30回合");
            }
            if (CurrentPlayerAttributes.当前血量 == 0) {
                CurrentPlayerAttributes.当前血量=CurrentPlayerAttributes.血量上限
                e.reply("很可惜您未能击败初夏,再接再厉！");
                if (Math.random() < BattleFrame * 0.012) {
                    let ExpFormBOSS = 1000 + data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id * 210;
                    e.reply(`你在与初夏的打斗中突然对其招式有所领悟，修为提升${ExpFormBOSS}`);
                    CurrentPlayerAttributes.修为 += ExpFormBOSS;
                    CurrentPlayerAttributes.当前血量=CurrentPlayerAttributes.血量上限
                }
                if (Math.random() < BattleFrame * 0.012) {
                    let HPFormBOSS = 5000 + CurrentPlayerAttributes.血量上限 * 0.2;
                    if (HPFormBOSS > CurrentPlayerAttributes.血量上限) HPFormBOSS = CurrentPlayerAttributes.血量上限 - CurrentPlayerAttributes.当前血量;
                    HPFormBOSS = Math.trunc(HPFormBOSS);
                    e.reply(`虽然你被锤得半死不活，但是却因此通了气血，生命恢复${HPFormBOSS}点`);
                    CurrentPlayerAttributes.当前血量 += HPFormBOSS;
                    CurrentPlayerAttributes.当前血量=CurrentPlayerAttributes.血量上限
                }
            }
            
            await sleep(1000);
            PlayerRecordJSON.TotalDamage[Userid] += TotalDamage;
            redis.set("Xiuxian:PlayerRecord3", JSON.stringify(PlayerRecordJSON));
            await data.setData("player", e.user_id, CurrentPlayerAttributes);
            redis.set("Xiuxian:WorldBossStatus3", JSON.stringify(WorldBossStatus));


            if (WorldBossStatus.当前血量 == 0) {
                e.reply("初夏被击杀！玩家们可以根据贡献获得奖励！");
                await sleep(1000);
                await Add_najie_thing(e.user_id,"清灵藏的新春木盒","道具",1)

                e.reply([segment.at(e.user_id),"\n恭喜你亲手结果了初夏的性命,为民除害，额外获得50000灵石奖励！"]);
                CurrentPlayerAttributes.灵石 += 50000;
                Bot.logger.mark(`[初夏] 结算:${e.user_id}增加奖励50000`);
                await data.setData("player", e.user_id, CurrentPlayerAttributes);
                let action = await redis.get("xiuxian:player:" + e.user_id + ":action");
                action = await JSON.parse(action);
                action.end_time = new Date().getTime();
                await redis.set("xiuxian:player:" + e.user_id + ":action", JSON.stringify(action));
                WorldBossStatus.KilledTime = new Date().getTime();
                redis.set("Xiuxian:WorldBossStatus3", JSON.stringify(WorldBossStatus));
                let PlayerList = await SortPlayer(PlayerRecordJSON);
                e.reply("正在进行存档有效性检测，如果长时间没有回复请联系主人修复存档并手动按照贡献榜发放奖励");
                for (let i = 0; i < PlayerList.length; i++)
                    await data.getData("player", PlayerRecordJSON.QQ[PlayerList[i]]);
                let Show_MAX;
                let Rewardmsg = [
                    "****初夏副本贡献排行榜****"
                ];
                if (PlayerList.length > 20) Show_MAX = 20;
                else Show_MAX = PlayerList.length;
                let TotalDamage = 0;
                for (let i = 0; i < (PlayerList.length <= 20 ? PlayerList.length : 20); i++)
                    TotalDamage += PlayerRecordJSON.TotalDamage[PlayerList[i]];
                for (var i = 0; i < PlayerList.length; i++) {
                    let CurrentPlayer = await data.getData("player", PlayerRecordJSON.QQ[PlayerList[i]]);
                    if (i < Show_MAX) {
                        let Reward;
                        if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.025)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.06);
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.05)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.045);
                            if (Reward<Math.trunc(TotalDamage*0.025*0.06))
                            {
                                Reward=Math.trunc(TotalDamage*0.025*0.06);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.075)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.036);
                            if (Reward<Math.trunc(TotalDamage*0.05*0.045))
                            {
                                Reward=Math.trunc(TotalDamage*0.05*0.045);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.1)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.032);
                            if (Reward<Math.trunc(TotalDamage*0.075*0.036))
                            {
                                Reward=Math.trunc(TotalDamage*0.075*0.036);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.15)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.025);
                            if (Reward<Math.trunc(TotalDamage*0.1*0.032))
                            {
                                Reward=Math.trunc(TotalDamage*0.1*0.032);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.2)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.022);
                            if (Reward<Math.trunc(TotalDamage*0.15*0.025))
                            {
                                Reward=Math.trunc(TotalDamage*0.15*0.025);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.3)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.018);
                            if (Reward<Math.trunc(TotalDamage*0.2*0.022))
                            {
                                Reward=Math.trunc(TotalDamage*0.2*0.022);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.4)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.016);
                            if (Reward<Math.trunc(TotalDamage*0.3*0.018))
                            {
                                Reward=Math.trunc(TotalDamage*0.3*0.018);
                            }
                        }
                        else if ((PlayerRecordJSON.TotalDamage[PlayerList[i]] / TotalDamage)<=0.5)
                        {
                            Reward=Math.trunc(PlayerRecordJSON.TotalDamage[PlayerList[i]]*0.015);
                            if (Reward<Math.trunc(TotalDamage*0.4*0.016))
                            {
                                Reward=Math.trunc(TotalDamage*0.4*0.016);
                            }
                        }
                        else
                        {
                            Reward=Math.trunc(TotalDamage*0.5*0.015);
                        }
                        if (TotalDamage>120000000)
                        {
                            Reward=Math.trunc(Reward/(TotalDamage/120000000));
                        }
                        if (Reward<100000)
                        {
                            Reward=100000;
                        }
                        Rewardmsg.push("第" + `${i + 1}` + "名:\n" + `名号:${CurrentPlayer.名号}` + '\n' + `伤害:${PlayerRecordJSON.TotalDamage[PlayerList[i]]}` + '\n' + `获得灵石奖励${Reward}`);
                        await Add_najie_thing(CurrentPlayer.id,"清灵藏的新春木盒","道具",1)
                        Bot.logger.mark(`[初夏副本] 结算:${PlayerRecordJSON.QQ[PlayerList[i]]}增加灵石奖励${Reward}并且获得清灵藏的新春木盒x1`);
                            
                        await redis.set("xiuxian:player:" + CurrentPlayer.id + ":Guanghangon", JSON.stringify(action2+1))

                        CurrentPlayer.灵石 += Reward;
                        await data.setData("player", PlayerRecordJSON.QQ[PlayerList[i]], CurrentPlayer);
    
                        continue;
                    }
                    else {
                        CurrentPlayer.灵石 += 300000;
                        Bot.logger.mark(`[初夏副本] 结算:${PlayerRecordJSON.QQ[PlayerList[i]]}增加奖励300000`);
                        await data.setData("player", PlayerRecordJSON.QQ[PlayerList[i]], CurrentPlayer);
                    }
                    if (i == PlayerList.length - 1) Rewardmsg.push("其余参与的修仙者均获得300000灵石奖励！");
                }
                await ForwardMsg(e, Rewardmsg);
                DeleteWorldBoss();
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

//初始化初夏
async function InitWorldBoss() {
    let AverageDamageStruct = await GetAverageDamage();
    let player_quantity = parseInt(AverageDamageStruct.player_quantity);
    let AverageDamage = parseInt(AverageDamageStruct.AverageDamage);
    let fairyNums = parseInt(AverageDamageStruct.fairy_nums);
    WorldBOSSBattleLock = 0;
    let X = AverageDamage * 0.01;
    Bot.logger.mark(`[初夏] 化神玩家总数：${player_quantity}`);
    Bot.logger.mark(`[初夏] 生成基数:${X}`);
    let Health =  Math.trunc(X * 280 * player_quantity*2);
    let Attack = Math.trunc(X*200);
    let Defence = Math.trunc(X*190);
    let yuansu=["仙之心·火","仙之心·水","仙之心·雷","仙之心·冰","仙之心·木"];
    let index = Math.trunc(Math.random() * yuansu.length);
    let linggen = yuansu[index];
    let WorldBossStatus = {
        "名号":"初夏",
        "当前血量": Health,
        "血量上限": Health,
        "isAngry": 0,
        "isWeak": 0,
        "攻击": Attack,
        "防御": Defence,
        "灵根": {
            "name": linggen,
        },
        "KilledTime": -1,
    };
    let PlayerRecord = 0;
    await redis.set("Xiuxian:WorldBossStatus3", JSON.stringify(WorldBossStatus));
    await redis.set("Xiuxian:PlayerRecord3", JSON.stringify(PlayerRecord));
    return 0;
}

//获取初夏是否已开启
async function BossIsAlive() {
    return (await redis.get("Xiuxian:WorldBossStatus3") && await redis.get("Xiuxian:PlayerRecord3"));
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
    }, 10000);
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
    //初夏结束指令
async function DeleteWorldBoss() {
    if (await BossIsAlive()) {
        await redis.del("Xiuxian:WorldBossStatus3");
        await redis.del("Xiuxian:PlayerRecord3");
    }
    return ;
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
        if (level_id >21 && level_id<42) {
            temp[TotalPlayer] = parseInt(player.攻击);
            Bot.logger.mark(`[初夏] ${this_qq}玩家攻击:${temp[TotalPlayer]}`);
            TotalPlayer++;
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
