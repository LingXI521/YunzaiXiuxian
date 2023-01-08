import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq"
import data from '../model/XiuxianData.js'
import fs from "fs"


//本模块由(qq:1695037643)和jio佬完成
export class DSC extends plugin {
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
                    reg: '^#炼神魄$',
                    fnc: 'WorldBossBattle'
                }
            ]
        })
    }


    //与未知妖物战斗
    async WorldBossBattle(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        if (await data.existData("player", e.user_id)) {
            let CurrentPlayerAttributes = await data.getData("player", e.user_id);
            if (data.Level_list.find(item => item.level_id === CurrentPlayerAttributes.level_id).level_id > 53) {
                e.reply("体魄超过53级无法接触【锻神池】");
                return true;
            }
            if (CurrentPlayerAttributes.当前血量 <= 100000) {
                e.reply("身体没有状态 下去送死？");
                return true;
            }
    let usr_qq = e.user_id;
    let player = data.getData("player", usr_qq);
    let 神魄段数 = player.神魄段数
    //人数的万倍
    let Health = 100000*神魄段数;
    //攻击
    let Attack = 100000*神魄段数;
    //防御
    let Defence = 10000*神魄段数;
    //奖励下降
    let Reward = 1200*神魄段数;
    let bosszt = {
        "Health": Health,
        "OriginHealth": Health,
        "isAngry": 0,
        "isWeak": 0,
        "Attack": Attack,
        "Defence": Defence,
        "KilledTime": -1,
        "Reward": Reward,
    };
            let BattleFrame = 0, TotalDamage = 0, msg = [];
            let BOSSCurrentAttack = bosszt.isAngry ? Math.trunc(bosszt.Attack * 1.8) : bosszt.isWeak ? Math.trunc(bosszt.Attack * 0.7) : bosszt.Attack;
            let BOSSCurrentDefence = bosszt.isWeak ? Math.trunc(bosszt.Defence * 0.7) : bosszt.Defence;
            while (CurrentPlayerAttributes.当前血量 > 0 && bosszt.Health > 0) {
                let Random = Math.random();
                if (!(BattleFrame & 1)) {
                    let Player_To_BOSS_Damage = Harm(CurrentPlayerAttributes.攻击, BOSSCurrentDefence) + Math.trunc(CurrentPlayerAttributes.攻击 * CurrentPlayerAttributes.灵根.法球倍率);
                    let SuperAttack = (2 < CurrentPlayerAttributes.暴击率) ? 1.5 : 1;
                    msg.push(`第${Math.trunc(BattleFrame / 2) + 1}回合：`);
                    if (BattleFrame==0){
                        msg.push("你进入锻神池，开始了！");
                        Player_To_BOSS_Damage = 0;
                    }
                    Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * SuperAttack);
                    bosszt.Health -= Player_To_BOSS_Damage;
                    TotalDamage += Player_To_BOSS_Damage;
                    if (bosszt.Health < 0) { bosszt.Health = 0 }
                    msg.push(`${CurrentPlayerAttributes.名号}${ifbaoji(SuperAttack)}消耗了${Player_To_BOSS_Damage}，此段剩余${bosszt.Health}未炼化`);
                }
                else {
                    let BOSS_To_Player_Damage = Harm(BOSSCurrentAttack, Math.trunc(CurrentPlayerAttributes.防御 * 0.1));
                    if (CurrentPlayerAttributes.学习的功法&&CurrentPlayerAttributes.学习的功法.indexOf("剑帝一剑")>-1 && BattleFrame==2) {
                        msg.push("你发现剑帝的剑法还可以使用！ 【护身剑罡！】（吸收的负担减轻20%）");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.8);
                    }
                    CurrentPlayerAttributes.当前血量 -= BOSS_To_Player_Damage;
                    bosszt.isAngry ? --bosszt.isAngry : 0;
                    bosszt.isWeak ? --bosszt.isWeak : 0;
                    if (!bosszt.isAngry && BOSSCurrentAttack > bosszt.Attack) BOSSCurrentAttack = bosszt.Attack;
                    if (!bosszt.isWeak && BOSSCurrentDefence < bosszt.Defence) BOSSCurrentDefence = bosszt.Defence;
                    if (CurrentPlayerAttributes.当前血量 < 0) { CurrentPlayerAttributes.当前血量 = 0 }
                    msg.push(`${CurrentPlayerAttributes.名号}损失血量${BOSS_To_Player_Damage}，${CurrentPlayerAttributes.名号}剩余血量${CurrentPlayerAttributes.当前血量}`);
                }
                if (CurrentPlayerAttributes.当前血量 == 0 || bosszt.Health == 0)
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
            if (bosszt.Health == 0) {
                CurrentPlayerAttributes.神魄段数 += 5;
                CurrentPlayerAttributes.血气 += Reward;      
                CurrentPlayerAttributes.当前血量 = CurrentPlayerAttributes.血量上限;         
                e.reply([segment.at(e.user_id), `\n你成功突破一段神魄，段数+5！血气增加${Reward} 血量补偿满血！`]);
                await data.setData("player", e.user_id, CurrentPlayerAttributes);  
            }
            if (CurrentPlayerAttributes.当前血量 == 0||CurrentPlayerAttributes.当前血量 < 0) {
                CurrentPlayerAttributes.当前血量 = 0; 
                let JL = Reward*2               
                JL = Number(JL)
                JL= JL.toFixed(0)                        
                CurrentPlayerAttributes.修为 -= JL;               
                e.reply([segment.at(e.user_id), `\n你未能通过此层锻神池！修为-${JL}`]);
                await data.setData("player", e.user_id, CurrentPlayerAttributes);
            }
           
            return true;
        }
        else {
            e.reply("区区凡人，也想参与吗？");
            return true;
        }
    }
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