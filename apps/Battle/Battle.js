//插件加载
import plugin from '../../../../lib/plugins/plugin.js';
import config from '../../model/Config.js';
import data from '../../model/XiuxianData.js';
import { segment } from 'oicq';
import {
  existplayer,
  exist_najie_thing,
  ForwardMsg,
  isNotNull,
  Write_player,
  Gaodenyuansulun,
} from '../Xiuxian/xiuxian.js';
import { Read_player } from '../Xiuxian/xiuxian.js';
import {
  Add_najie_thing,
  Add_灵石,
  Add_HP,
  Add_血气,
} from '../Xiuxian/xiuxian.js';
import { get_random_talent } from '../Xiuxian/xiuxian.js';

/**
 * 战斗类
 */

export class Battle extends plugin {
  constructor() {
    super({
      name: 'Yunzai_Bot_Battle',
      dsc: '修仙模块',
      event: 'message',
      priority: 600,
      rule: [
        {
          reg: '^打劫$',
          fnc: 'Dajie',
        },
        {
          reg: '^(以武会友)$',
          fnc: 'biwu',
        },
      ],
    });
    this.set = config.getConfig('xiuxian', 'xiuxian');
    this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
  }

  //打劫
  async Dajie(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    // 判断是否在开启时间

    const nowDate = new Date();
    const todayDate = new Date(nowDate);
    const { openHour, closeHour } = this.set.Auction;
    const todayTime = todayDate.setHours(0, 0, 0, 0);
    const openTime = todayTime + openHour * 60 * 60 * 1000;
    const nowTime1 = nowDate.getTime();
    const closeTime = todayTime + closeHour * 60 * 60 * 1000;
    if (!(nowTime1 < openTime || nowTime1 > closeTime)) {
      e.reply(`这个时间由星阁阁主看管,还是不要张扬较好`);
      return;
    }

    //得到主动方qq
    let A = e.user_id;

    //先判断
    let ifexistplay_A = await existplayer(A);
    if (!ifexistplay_A || e.isPrivate) {
      return;
    }

    //看看状态

    //得到redis游戏状态
    let last_game_timeA = await redis.get(
      'xiuxian:player:' + A + ':last_game_time'
    );
    //设置游戏状态
    if (last_game_timeA == 0) {
      e.reply(`猜大小正在进行哦!`);
      return true;
    }

    //判断对方
    let isat = e.message.some(item => item.type === 'at');
    if (!isat) {
      return;
    }
    //获取对方qq
    let atItem = e.message.filter(item => item.type === 'at');
    let B = atItem[0].qq; //被打劫者

    //先判断存档！
    let ifexistplay_B = await existplayer(B);
    if (!ifexistplay_B) {
      e.reply('不可对凡人出手!');
      return;
    }

    //出手的
    //读取信息
    let playerAA = await Read_player(A);
    //境界
    let now_level_idAA;
    if (!isNotNull(playerAA.level_id)) {
      e.reply('请先#同步信息');
      return;
    }
    now_level_idAA = data.Level_list.find(
      item => item.level_id == playerAA.level_id
    ).level_id;

    //对方
    //读取信息
    let playerBB = await Read_player(B);
    //境界
    //根据名字取找境界id

    let now_level_idBB;

    if (!isNotNull(playerBB.level_id)) {
      e.reply('对方为错误存档！');
      return;
    }

    now_level_idBB = data.Level_list.find(
      item => item.level_id == playerBB.level_id
    ).level_id;

    //A是仙人，B不是仙人
    if (now_level_idAA > 42 && now_level_idBB <= 41) {
      e.reply(`仙人不可对凡人出手！`);
      return;
    }

    //A是修仙者，B不是
    if (now_level_idAA >= 12 && now_level_idBB < 12) {
      e.reply(`不可欺负弱小！`);
      return;
    }

    if (A == B) {
      e.reply('咋的，自己弄自己啊？');
      return;
    }
    let playerA = data.getData('player', A);
    let playerB = data.getData('player', B);
    if (isNotNull(playerA.宗门) && isNotNull(playerB.宗门)) {
      var assA = data.getAssociation(playerA.宗门.宗门名称);
      var assB = data.getAssociation(playerB.宗门.宗门名称);
      if (assA.宗门名称 == assB.宗门名称) {
        e.reply('门派禁止内讧');
        return;
      }
    }

    let A_action = await redis.get('xiuxian:player:' + A + ':action');
    A_action = JSON.parse(A_action);
    if (A_action != null) {
      let now_time = new Date().getTime();
      //人物任务的动作是否结束
      let A_action_end_time = A_action.end_time;
      if (now_time <= A_action_end_time) {
        let m = parseInt((A_action_end_time - now_time) / 1000 / 60);
        let s = parseInt((A_action_end_time - now_time - m * 60 * 1000) / 1000);
        e.reply(
          '正在' + A_action.action + '中,剩余时间:' + m + '分' + s + '秒'
        );
        return;
      }
    }

    let last_game_timeB = await redis.get(
      'xiuxian:player:' + B + ':last_game_time'
    );
    if (last_game_timeB == 0) {
      e.reply(`对方猜大小正在进行哦，等他赚够了再打劫也不迟!`);
      return true;
    }

    let isBbusy = false; //给B是否忙碌加个标志位，用来判断要不要扣隐身水

    let B_action = await redis.get('xiuxian:player:' + B + ':action');
    B_action = JSON.parse(B_action);
    if (B_action != null) {
      let now_time = new Date().getTime();
      //人物任务的动作是否结束
      let B_action_end_time = B_action.end_time;
      if (now_time <= B_action_end_time) {
        isBbusy = true;
        let ishaveyss = await exist_najie_thing(A, '隐身水', '道具');
        if (!ishaveyss) {
          //如果A没有隐身水，直接返回不执行
          let m = parseInt((B_action_end_time - now_time) / 1000 / 60);
          let s = parseInt(
            (B_action_end_time - now_time - m * 60 * 1000) / 1000
          );
          e.reply(
            '对方正在' + B_action.action + '中,剩余时间:' + m + '分' + s + '秒'
          );
          return;
        }
      }
    }

    let now = new Date();
    let nowTime = now.getTime(); //获取当前时间戳
    let last_dajie_time = await redis.get(
      'xiuxian:player:' + A + ':last_dajie_time'
    ); //获得上次打劫的时间戳,
    last_dajie_time = parseInt(last_dajie_time);
    let robTimeout = parseInt(60000 * this.xiuxianConfigData.CD.rob);
    if (nowTime < last_dajie_time + robTimeout) {
      let waittime_m = Math.trunc(
        (last_dajie_time + robTimeout - nowTime) / 60 / 1000
      );
      let waittime_s = Math.trunc(
        ((last_dajie_time + robTimeout - nowTime) % 60000) / 1000
      );
      e.reply('打劫正在CD中，' + `剩余cd:  ${waittime_m}分 ${waittime_s}秒`);
      return;
    }
    let A_player = await Read_player(A);
    let B_player = await Read_player(B);
    if (A_player.修为 < 0) {
      e.reply(`还是闭会关再打劫吧`);
      return;
    }
    if (B_player.当前血量 < 20000) {
      e.reply(`${B_player.名号} 重伤未愈,就不要再打他了`);
      return;
    }
    if (B_player.灵石 < 30002) {
      e.reply(`${B_player.名号} 穷得快赶上水脚脚了,就不要再打他了`);
      return;
    }
    let final_msg = [segment.at(A), segment.at(B), '\n'];

    //这里前戏做完,确定要开打了

    if (isBbusy) {
      //如果B忙碌,自动扣一瓶隐身水强行打架,奔着人道主义关怀,提前判断了不是重伤
      final_msg.push(
        `${B_player.名号}正在${B_action.action}，${A_player.名号}利用隐身水悄然接近，但被发现。`
      );
      await Add_najie_thing(A, '隐身水', '道具', -1);
    } else {
      final_msg.push(`${A_player.名号}向${B_player.名号}发起了打劫。`);
    }

    //校验有没有灵根,没有的,随机一个写进存档,之后可以删掉 ()
    if (A_player.灵根 == null || A_player.灵根 == undefined) {
      A_player.灵根 = await get_random_talent();
      A_player.修炼效率提升 += A_player.灵根.eff;
    }
    data.setData('player', A, A_player);
    if (B_player.灵根 == null || B_player.灵根 == undefined) {
      B_player.灵根 = await get_random_talent();
      B_player.修炼效率提升 += B_player.灵根.eff;
    }
    data.setData('player', B, B_player);

    A_player.法球倍率 = A_player.灵根.法球倍率;
    B_player.法球倍率 = B_player.灵根.法球倍率;

    let Data_battle = await zd_battle(A_player, B_player);
    let msg = Data_battle.msg;
    //战斗回合过长会导致转发失败报错，所以超过30回合的就不转发了
    if (msg.length > 35) {
    } else {
      await ForwardMsg(e, msg);
    }
    //下面的战斗超过100回合会报错
    await Add_HP(A, Data_battle.A_xue);
    await Add_HP(B, Data_battle.B_xue);
    let A_win = `${A_player.名号}击败了${B_player.名号}`;
    let B_win = `${B_player.名号}击败了${A_player.名号}`;
    if (msg.find(item => item == A_win)) {
      let mdzJL = A_player.魔道值;
      let lingshi = Math.trunc(B_player.灵石 / 5);
      let qixue = Math.trunc(100 * now_level_idAA);
      let mdz = Math.trunc(lingshi / 10000);
      if (lingshi >= B_player.灵石) {
        lingshi = B_player.灵石 / 2;
      }
      A_player.灵石 += lingshi;
      B_player.灵石 -= lingshi;
      A_player.血气 += qixue;
      A_player.魔道值 += mdz;
      A_player.灵石 += mdzJL;
      await Write_player(A, A_player);
      await Write_player(B, B_player);
      final_msg.push(
        ` 经过一番大战,${A_win},成功抢走${lingshi}灵石,${A_player.名号}获得${qixue}血气，`
      );
    } else if (msg.find(item => item == B_win)) {
      if (A_player.灵石 < 30002) {
        let qixue = Math.trunc(100 * now_level_idBB);
        B_player.血气 += qixue;
        await Write_player(B, B_player);
        var time2 = 60; //时间（分钟）
        var action_time2 = 60000 * time2; //持续时间，单位毫秒
        var action2 = await redis.get('xiuxian:player:' + A + ':action');
        action2 = await JSON.parse(action2);
        action2.action = '禁闭';
        action2.end_time = new Date().getTime() + action_time2;
        await redis.set(
          'xiuxian:player:' + A + ':action',
          JSON.stringify(action2)
        );
        final_msg.push(
          `经过一番大战,${A_player.名号}被${B_player.名号}击败了,${B_player.名号}获得${qixue}血气,${A_player.名号} 真是偷鸡不成蚀把米,被关禁闭60分钟`
        );
      } else {
        let lingshi = Math.trunc(A_player.灵石 / 4);
        let qixue = Math.trunc(100 * now_level_idBB);
        if (lingshi <= 0) {
          lingshi = 0;
        }
        A_player.灵石 -= lingshi;
        B_player.灵石 += lingshi;
        B_player.血气 += qixue;
        await Write_player(A, A_player);
        await Write_player(B, B_player);
        final_msg.push(
          `经过一番大战,${A_player.名号}被${B_player.名号}击败了,${B_player.名号}获得${qixue}血气,${A_player.名号} 真是偷鸡不成蚀把米,被劫走${lingshi}灵石`
        );
      }
    } else {
      e.reply(`战斗过程出错`);
      return;
    }
    e.reply(final_msg);
    //本次打劫时间存入缓存
    await redis.set('xiuxian:player:' + A + ':last_dajie_time', nowTime); //存入缓存
    return;
  }

  //比武
  async biwu(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let A = e.user_id;

    //先判断
    let ifexistplay_A = await existplayer(A);
    if (!ifexistplay_A || e.isPrivate) {
      return;
    }
    //看看状态
    //得到redis游戏状态
    let last_game_timeA = await redis.get(
      'xiuxian:player:' + A + ':last_game_time'
    );
    //设置游戏状态
    if (last_game_timeA == 0) {
      e.reply(`猜大小正在进行哦!`);
      return true;
    }

    let isat = e.message.some(item => item.type === 'at');
    if (!isat) {
      return;
    }
    let atItem = e.message.filter(item => item.type === 'at');
    let B = atItem[0].qq; //后手

    if (A == B) {
      e.reply('你还跟自己修炼上了是不是?');
      return;
    }
    let ifexistplay_B = await existplayer(B);
    if (!ifexistplay_B) {
      e.reply('修仙者不可对凡人出手!');
      return;
    }
    //这里前戏做完,确定要开打了
    let final_msg = [segment.at(A), segment.at(B), '\n'];
    let A_player = await Read_player(A);
    let B_player = await Read_player(B);
    final_msg.push(`${A_player.名号}向${B_player.名号}发起了切磋。`);
    A_player.法球倍率 = A_player.灵根.法球倍率;
    B_player.法球倍率 = B_player.灵根.法球倍率;
    A_player.当前血量 = A_player.血量上限;
    B_player.当前血量 = B_player.血量上限;
    let Data_battle = await zd_battle(A_player, B_player);
    let msg = Data_battle.msg;
    //战斗回合过长会导致转发失败报错，所以超过30回合的就不转发了
    // if (msg.length > 30) {
    //     e.reply("战斗过程超过30回合，略");
    // } else {
    await ForwardMsg(e, msg);
    // }
    //下面的战斗超过100回合会报错
    let A_win = `${A_player.名号}击败了${B_player.名号}`;
    let B_win = `${B_player.名号}击败了${A_player.名号}`;
    if (msg.find(item => item == A_win)) {
    } else if (msg.find(item => item == B_win)) {
    } else {
      e.reply(`战斗过程出错`);
      return;
    }
    //最后发送消息
    e.reply(final_msg);
    let level_idBB = data.Level_list.find(
      item => item.level_id == B_player.Physique_id
    ).level_id;
    await Add_血气(B, 20 * level_idBB);
    return;
  }
}
export async function zd_battle(A_player, B_player) {
  let now_A_HP = A_player.当前血量; //保留初始血量方便计算最后扣多少血,避免反复读写文件
  let now_B_HP = B_player.当前血量;
  let A_xue = 0; //最后要扣多少血
  let B_xue = 0;
  let cnt = 0; //回合数
  let afangyu = A_player.防御; //记录A原防御
  let bfangyu = B_player.防御; //记录B原防御
  let aATK = A_player.攻击; //记录A原攻击
  let bATK = B_player.攻击; //记录B原攻击
  let Agandianhuihe = 0; //感电燃烧回合数
  let Bgandianhuihe = 0; //感电燃烧回合数
  let Achaodaohuihe = 0; //超导回合数
  let Bchaodaohuihe = 0; //超导回合数
  let msg = [];
  while (A_player.当前血量 > 0 && B_player.当前血量 > 0) {
    if (cnt % 2 == 0) {
      let baoji = baojishanghai(A_player.暴击率);
      if (!isNotNull(A_player.仙宠)) {
        //判断有无仙宠
      } else if (A_player.仙宠.type == '暴伤') {
        baoji = baojishanghai(A_player.暴击率) + A_player.仙宠.加成;
      }
      let 持续伤害 = 0;
      let yuansu = await Gaodenyuansulun(
        A_player,
        B_player,
        aATK,
        msg,
        cnt,
        Agandianhuihe,
        Achaodaohuihe
      );
      Agandianhuihe = yuansu.gandianhuihe;
      Achaodaohuihe = yuansu.chaodaohuihe2;
      A_player = yuansu.A_player;
      B_player = yuansu.B_player;
      if (yuansu.chaodao && Achaodaohuihe > 0) {
        Achaodaohuihe -= 1;
        msg.push(
          B_player.名号 + '的抗性大大下降,虚弱状态剩余' + Achaodaohuihe + '回合'
        );
        B_player.防御 *= 0.5;
      }

      if (yuansu.fyjiachen != 0) {
        A_player.防御 += yuansu.fyjiachen;
      }
      msg = yuansu.msg;
      let 伤害 = Harm(A_player.攻击 * 0.85, B_player.防御);
      let 法球伤害 = Math.trunc(A_player.攻击 * A_player.法球倍率);
      伤害 = Math.trunc(baoji * 伤害 + 法球伤害 + A_player.防御 * 0.1);
      let Random = Math.random();
      if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·鬼帝功') > -1 &&
        Random > 0.2 &&
        cnt == 0
      ) {
        msg.push(
          `${A_player.名号} 使用【鬼剑】然暴起冲向 ${B_player.名号}，速度之快，对方根本反应不过来。`
        );
        伤害 = Math.trunc(伤害 * 1.1 + 100000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪八品·影杀') > -1 &&
        Random > 0.2 &&
        cnt == 0
      ) {
        msg.push(
          `${A_player.名号} 使用影杀！突然暴起冲向 ${B_player.名号}，速度之快，对方根本反应不过来。`
        );
        伤害 = Math.trunc(伤害 * 1 + 100000);
      } else if (Random > 0.5 && cnt == 0) {
        msg.push(
          `你找准时机！突然暴起冲向 ${B_player.名号}，但是被对方反应过来了`
        );
        伤害 = 0;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·八荒剑法') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用八荒剑法【斩八荒！】`);
        伤害 = Math.trunc(伤害 * 1.2);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·天星') > -1 &&
        cnt == 4
      ) {
        msg.push(`${A_player.名号} 使用天星【天动万象！】`);
        伤害 = Math.trunc(伤害 * 1.2 + 200000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·太素') > -1 &&
        cnt == 4
      ) {
        msg.push(`${A_player.名号} 使用太素【太素】`);
        伤害 = Math.trunc(伤害 * 1.2 + 200000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·心禅不灭诀') > -1 &&
        cnt == 4
      ) {
        msg.push(`${A_player.名号} 使用八品·心禅不灭诀【万剑归宗】`);
        伤害 *= 1.25;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用八品·太皇经【无量仙功】开始聚集仙气`);
        伤害 *= 0.9;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用八品·太皇经 聚集完成！【皇极斩！】`);
        伤害 = Math.trunc(伤害 * 1.25 + 500000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪八品·二重梦之㱬') > -1 &&
        cnt == 6
      ) {
        msg.push(`${A_player.名号} 使用二重梦之㱬【梦轮】`);
        伤害 *= 1.25;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('九品·第一魔功') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用第一魔功【噬天！】`);
        伤害 = Math.trunc(伤害 * 1.15 + 300000);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('九品·第一魔功') > -1 &&
        Random < 0.03
      ) {
        msg.push(
          `${B_player.名号} 使用了第一魔功【魔转！】你的伤害被转走了大部分`
        );
        伤害 *= 0.5;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('伪九品·魔帝功') > -1 &&
        Random < 0.3 &&
        cnt == 2
      ) {
        msg.push(`${B_player.名号} 使用了魔帝功【吞噬】你的伤害被吸收了`);
        伤害 *= -0.1;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·避空') > -1 &&
        cnt == 4
      ) {
        msg.push(`${B_player.名号} 使用了避空【遁空！】`);
        伤害 *= 0.5;
      } else if (Random < 0.06) {
        msg.push(`你找到了 ${B_player.名号} 的破绽！这一下无处可逃！`);
        伤害 *= 1.3;
      } else if (A_player.灵根.name === '轮回道体' && cnt == 0) {
        msg.push(`${A_player.名号} 使用了先天神通，轮回之力需要时间准备`);
        伤害 *= 0.8;
      } else if (A_player.灵根.name === '轮回道体' && cnt == 4) {
        msg.push(`${A_player.名号} 使用了先天神通，轮回之力崩泄而出！`);
        伤害 *= 1.5;
      } else if (B_player.灵根.name === '破虚踏星体' && Random > 0.98) {
        msg.push(`${B_player.名号}使用了先天神通 【破虚】！你的伤害无法命中！`);
        伤害 *= 0;
      } else if (B_player.灵根.type === '转生' && Random > 0.98) {
        msg.push(`${B_player.名号}使用了转生神通 【轮墓】！你的伤害无法生效！`);
        伤害 *= 0;
      } else if (A_player.灵根.name === '灭道杀神体' && cnt == 12) {
        msg.push(`${A_player.名号}使用了先天神通 【杀破神】！`);
        伤害 *= 3;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·桃花神功') > -1 &&
        cnt == 4 &&
        Random > 0.66
      ) {
        msg.push(
          `${A_player.名号} 使用了【三生桃花！】你的攻击慢慢变成了漫天桃花飞舞。`
        );
        伤害 *= -0.2;
      } else if (Random > 0.94) {
        msg.push(`你的攻击被 ${B_player.名号} 破解了`);
        伤害 *= 0.6;
      } else if (Random > 0.9) {
        msg.push(`你的攻击被 ${B_player.名号} 接下来了`);
        伤害 *= 0.8;
      }

      if (yuansu.ranshao && Agandianhuihe > 0) {
        持续伤害 = Math.trunc(伤害 * 0.15);
        Agandianhuihe -= 1;
        B_player.当前血量 -= 持续伤害;
        msg.push(B_player.名号 + '烧了起来,受到了' + 持续伤害 + '的燃烧伤害');
      }
      if (yuansu.gandian && Agandianhuihe > 0) {
        持续伤害 = Math.trunc(伤害 * 0.15);
        Agandianhuihe -= 1;
        B_player.当前血量 -= 持续伤害;
        msg.push(B_player.名号 + '触电了,受到了' + 持续伤害 + '的感电伤害');
      }
      if (A_player.魔道值 > 999) {
        var buff = Math.trunc(A_player.魔道值 / 1000) / 20 + 1;
        if (buff > 2) buff = 2;
        伤害 *= buff;
      }
      伤害 = Math.trunc(伤害);
      B_player.当前血量 -= 伤害;
      B_player.防御 = bfangyu;
      if (B_player.当前血量 < 0) {
        B_player.当前血量 = 0;
      }
      msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${A_player.名号}攻击了${B_player.名号}，${ifbaoji(baoji)}造成伤害${伤害}，${
        B_player.名号
      }剩余血量${B_player.当前血量}`);

      //说明被冻结了
      if (cnt != yuansu.cnt) {
        msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${B_player.名号}冻结中`);
        cnt += 2;
        continue;
      }
    }

    if (cnt % 2 == 1) {
      let baoji = baojishanghai(B_player.暴击率);
      if (!isNotNull(B_player.仙宠)) {
        //判断有无仙宠
      } else if (B_player.仙宠.type == '暴伤') {
        baoji = baojishanghai(B_player.暴击率) + B_player.仙宠.加成;
      }
      let 持续伤害 = 0;
      let yuansu = await Gaodenyuansulun(
        B_player,
        A_player,
        bATK,
        msg,
        cnt,
        Bgandianhuihe,
        Bchaodaohuihe
      );
      Bgandianhuihe = yuansu.gandianhuihe;
      Bchaodaohuihe = yuansu.chaodaohuihe2;
      A_player = yuansu.B_player;
      B_player = yuansu.A_player;
      if (yuansu.chaodao && Bchaodaohuihe > 0) {
        Bchaodaohuihe -= 1;
        msg.push(
          A_player.名号 + '的抗性大大下降,虚弱状态剩余' + Bchaodaohuihe + '回合'
        );
        A_player.防御 *= 0.5;
      }

      if (yuansu.fyjiachen != 0) {
        B_player.防御 += yuansu.fyjiachen;
      }
      msg = yuansu.msg;
      let 伤害 = Harm(B_player.攻击 * 0.85, A_player.防御);
      let 法球伤害 = Math.trunc(B_player.攻击 * B_player.法球倍率);
      伤害 = Math.trunc(baoji * 伤害 + 法球伤害 + B_player.防御 * 0.1);
      let Random = Math.random();
      if (Random < 0.06) {
        msg.push(`你找到了 ${A_player.名号} 的破绽！这一下无处可逃！`);
        伤害 *= 1.3;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·八荒剑法') > -1 &&
        cnt == 3
      ) {
        msg.push(`${B_player.名号} 使用八荒剑法【斩八荒！】`);
        伤害 *= 1.2;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 3
      ) {
        msg.push(`${B_player.名号} 使用八品·太皇经【无量仙功】开始聚集仙气`);
        伤害 *= 0.9;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 9
      ) {
        msg.push(`${A_player.名号} 使用八品·太皇经 聚集完成！【皇极斩！】`);
        伤害 = Math.trunc(伤害 * 1.25 + 500000);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·天星') > -1 &&
        cnt == 5
      ) {
        msg.push(`${B_player.名号} 使用天星【天动万象！】`);
        伤害 = Math.trunc(伤害 * 1.2 + 200000);
      } else if (
        A_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·太素') > -1 &&
        cnt == 4
      ) {
        msg.push(`${B_player.名号} 使用太素【太素】`);
        伤害 = Math.trunc(伤害 * 1.2 + 200000);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·心禅不灭诀') > -1 &&
        cnt == 5
      ) {
        msg.push(`${B_player.名号} 使用八品·心禅不灭诀【万剑归宗】`);
        伤害 = Math.trunc(伤害 * 1.25);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('伪八品·二重梦之㱬') > -1 &&
        cnt == 7
      ) {
        msg.push(`${B_player.名号} 使用二重梦之㱬【梦轮】`);
        伤害 = Math.trunc(伤害 * 1.25);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·避空') > -1 &&
        cnt == 5
      ) {
        msg.push(`${A_player.名号} 使用了避空【遁空！】`);
        伤害 = Math.trunc(伤害 * 0.5);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('九品·第一魔功') > -1 &&
        cnt == 3
      ) {
        msg.push(`${B_player.名号} 使用第一魔功【噬天！】`);
        伤害 = Math.trunc(伤害 * 1.15 + 300000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('九品·第一魔功') > -1 &&
        Random < 0.03
      ) {
        msg.push(
          `${A_player.名号} 使用了第一魔功【魔转！】你的伤害被转走了大部分`
        );
        伤害 = Math.trunc(伤害 * 0.5);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪九品·魔帝功') > -1 &&
        Random < 0.3 &&
        cnt == 3
      ) {
        msg.push(`${A_player.名号} 使用了魔帝功【吞噬】你的伤害被吸收了`);
        伤害 *= -0.1;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·桃花神功') > -1 &&
        cnt == 5 &&
        Random > 0.66
      ) {
        msg.push(
          `${B_player.名号} 使用了【三生桃花！】你的攻击慢慢变成了漫天桃花飞舞。`
        );
        伤害 *= -0.2;
      } else if (B_player.灵根.name === '轮回道体' && cnt == 0) {
        msg.push(`${B_player.名号} 使用了先天神通，轮回之力需要时间准备`);
        伤害 *= 0.8;
      } else if (B_player.灵根.name === '轮回道体' && cnt == 4) {
        msg.push(`${B_player.名号} 使用了先天神通，轮回之力崩泄而出！`);
        伤害 *= 1.5;
      } else if (A_player.灵根.name === '破虚踏星体' && Random > 0.98) {
        msg.push(`${A_player.名号}使用了先天神通 【破虚】！你的伤害无法命中！`);
        伤害 *= 0;
      } else if (A_player.灵根.type === '转生' && Random > 0.98) {
        msg.push(`${A_player.名号}使用了转生神通 【轮墓】！你的伤害无法生效！`);
        伤害 *= 0;
      } else if (B_player.灵根.name === '灭道杀神体' && cnt == 13) {
        msg.push(`${B_player.名号}使用了先天神通 【杀破神】！`);
        伤害 *= 3;
      } else if (Random > 0.94) {
        msg.push(`你的攻击被 ${A_player.名号} 破解了`);
        伤害 = Math.trunc(伤害 * 0.6);
      } else if (Random > 0.9) {
        msg.push(`你的攻击被 ${A_player.名号} 接下来了`);
        伤害 = Math.trunc(伤害 * 0.8);
      }

      if (yuansu.ranshao && Bgandianhuihe > 0) {
        持续伤害 = Math.trunc(伤害 * 0.15);
        Bgandianhuihe -= 1;
        A_player.当前血量 -= 持续伤害;
        msg.push(A_player.名号 + '烧了起来,受到了' + 持续伤害 + '的燃烧伤害');
      }
      if (yuansu.gandian && Bgandianhuihe > 0) {
        持续伤害 = Math.trunc(伤害 * 0.15);
        Bgandianhuihe -= 1;
        A_player.当前血量 -= 持续伤害;
        msg.push(A_player.名号 + '触电了,受到了' + 持续伤害 + '的感电伤害');
      }
      if (B_player.魔道值 > 999) {
        var buff = Math.trunc(B_player.魔道值 / 1000) / 20 + 1;
        if (buff > 2) buff = 2;
        伤害 *= buff;
      }
      伤害 = Math.trunc(伤害);
      A_player.当前血量 -= 伤害;
      A_player.防御 = afangyu;
      if (A_player.当前血量 < 0) {
        A_player.当前血量 = 0;
      }
      msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${B_player.名号}攻击了${A_player.名号}，${ifbaoji(baoji)}造成伤害${伤害}，${
        A_player.名号
      }剩余血量${A_player.当前血量}`);
      if (cnt != yuansu.cnt) {
        msg.push(`第${Math.trunc(cnt / 2) + 2}回合：
${A_player.名号}冻结中`);
        cnt++;
      }
    }
    cnt++;
  }
  if (A_player.当前血量 <= 0) {
    A_player.当前血量 = 0;
    msg.push(`${B_player.名号}击败了${A_player.名号}`);
    B_xue = B_player.当前血量 - now_B_HP;
    A_xue = -now_A_HP;
  }
  if (B_player.当前血量 <= 0) {
    B_player.当前血量 = 0;
    msg.push(`${A_player.名号}击败了${B_player.名号}`);
    B_xue = -now_B_HP;
    A_xue = A_player.当前血量 - now_A_HP;
  }

  //剃掉加成
  A_player.防御 = afangyu;
  B_player.防御 = bfangyu;
  A_player.攻击 = aATK;
  B_player.攻击 = bATK;

  let Data_nattle = {
    msg: msg,
    A_xue: A_xue,
    B_xue: B_xue,
  };
  return Data_nattle;
}
export function baojishanghai(baojilv) {
  if (baojilv > 1) {
    baojilv = 1;
  } //暴击率最高为100%,即1
  let rand = Math.random();
  let bl = 1;
  if (rand < baojilv) {
    bl = baojilv + 1.5; //这个是暴击伤害倍率//满暴击时暴伤2为50%
  }
  return bl;
}

//通过暴击伤害返回输出用的文本
export function ifbaoji(baoji) {
  if (baoji == 1) {
    return '';
  } else {
    return '触发暴击，';
  }
}

//攻击攻击防御计算伤害
export function Harm(atk, def) {
  let x;
  let s = atk / def;
  let rand = Math.trunc(Math.random() * 11) / 100 + 0.95; //保留±5%的伤害波动
  if (s < 1) {
    x = 0.1;
  } else if (s > 2.5) {
    x = 1;
  } else {
    x = 0.6 * s - 0.5;
  }
  x = Math.trunc(x * atk * rand);
  return x;
}

export async function mjzd_battle(A_player, B_player) {
  let now_A_HP = A_player.当前血量; //保留初始血量方便计算最后扣多少血,避免反复读写文件
  let now_B_HP = B_player.当前血量;
  let A_xue = 0; //最后要扣多少血
  let B_xue = 0;
  let cnt = 0; //回合数

  let msg = [];
  while (A_player.当前血量 > 0 && B_player.当前血量 > 0) {
    if (cnt % 2 == 0) {
      let baoji = baojishanghai(A_player.暴击率);
      if (!isNotNull(A_player.仙宠)) {
        //判断有无仙宠
      } else if (A_player.仙宠.type == '暴伤') {
        baoji = baojishanghai(A_player.暴击率) + A_player.仙宠.加成;
      }
      let 伤害 = Harm(A_player.攻击 * 0.85, B_player.防御);
      let 法球伤害 = Math.trunc(A_player.攻击 * A_player.法球倍率);
      伤害 = Math.trunc(baoji * 伤害 + 法球伤害 + A_player.防御 * 0.1);
      let Random = Math.random();
      if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·鬼帝功') > -1 &&
        Random > 0.2 &&
        cnt == 0
      ) {
        msg.push(
          `${A_player.名号} 使用【鬼剑】然暴起冲向 ${B_player.名号}，速度之快，对方根本反应不过来。`
        );
        伤害 = Math.trunc(伤害 * 1.1 + 100000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪八品·影杀') > -1 &&
        Random > 0.2 &&
        cnt == 0
      ) {
        msg.push(
          `${A_player.名号} 使用影杀！突然暴起冲向 ${B_player.名号}，速度之快，对方根本反应不过来。`
        );
        伤害 = Math.trunc(伤害 * 1 + 100000);
      } else if (Random > 0.5 && cnt == 0) {
        msg.push(
          `你找准时机！突然暴起冲向 ${B_player.名号}，但是被对方反应过来了`
        );
        伤害 = 0;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·八荒剑法') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用八荒剑法【斩八荒！】`);
        伤害 *= 1.2;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·天星') > -1 &&
        cnt == 4
      ) {
        msg.push(`${A_player.名号} 使用天星【天动万象！】`);
        伤害 = Math.trunc(伤害 * 1.2 + 200000);
      } else if (
        A_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·太素') > -1 &&
        cnt == 4
      ) {
        msg.push(`${B_player.名号} 使用太素【太素】`);
        伤害 = Math.trunc(伤害 * 1.2 + 200000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·心禅不灭诀') > -1 &&
        cnt == 4
      ) {
        msg.push(`${A_player.名号} 使用八品·心禅不灭诀【万剑归宗】`);
        伤害 *= 1.25;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用八品·太皇经【无量仙功】开始聚集仙气`);
        伤害 *= 0.9;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用八品·太皇经 聚集完成！【皇极斩！】`);
        伤害 = Math.trunc(伤害 * 1.25 + 500000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪八品·二重梦之㱬') > -1 &&
        cnt == 6
      ) {
        msg.push(`${A_player.名号} 使用二重梦之㱬【梦轮】`);
        伤害 *= 1.25;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪九品·第一魔功') > -1 &&
        cnt == 2
      ) {
        msg.push(`${A_player.名号} 使用第一魔功【噬天！】`);
        伤害 = Math.trunc(伤害 * 1.1 + 300000);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('伪九品·第一魔功') > -1 &&
        Random < 0.02
      ) {
        msg.push(
          `${B_player.名号} 使用了第一魔功【魔转！】你的伤害被转走了大部分`
        );
        伤害 *= 0.5;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('伪九品·魔帝功') > -1 &&
        Random < 0.3 &&
        cnt == 2
      ) {
        msg.push(`${B_player.名号} 使用了魔帝功【吞噬】你的伤害被吸收了`);
        伤害 *= -0.1;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·避空') > -1 &&
        cnt == 4
      ) {
        msg.push(`${B_player.名号} 使用了避空【遁空！】`);
        伤害 *= 0.5;
      } else if (Random < 0.06) {
        msg.push(`你找到了 ${B_player.名号} 的破绽！这一下无处可逃！`);
        伤害 *= 1.3;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·桃花神功') > -1 &&
        cnt == 4 &&
        Random > 0.66
      ) {
        msg.push(
          `${A_player.名号} 使用了【三生桃花！】你的攻击慢慢变成了漫天桃花飞舞。`
        );
        伤害 *= -0.2;
      } else if (Random > 0.94) {
        msg.push(`你的攻击被 ${B_player.名号} 破解了`);
        伤害 *= 0.6;
      } else if (Random > 0.9) {
        msg.push(`你的攻击被 ${B_player.名号} 接下来了`);
        伤害 *= 0.8;
      }
      伤害 = Math.trunc(伤害);
      B_player.当前血量 -= 伤害;
      if (B_player.当前血量 < 0) {
        B_player.当前血量 = 0;
      }
      msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${A_player.名号}攻击了${B_player.名号}，${ifbaoji(baoji)}造成伤害${伤害}，${
        B_player.名号
      }剩余血量${B_player.当前血量}`);
    }
    if (cnt % 2 == 1) {
      let baoji = baojishanghai(B_player.暴击率);
      if (!isNotNull(B_player.仙宠)) {
        //判断有无仙宠
      } else if (B_player.仙宠.type == '暴伤') {
        baoji = baojishanghai(B_player.暴击率) + B_player.仙宠.加成;
      }
      let 伤害 = Harm(B_player.攻击 * 0.85, A_player.防御);
      let 法球伤害 = Math.trunc(B_player.攻击 * B_player.法球倍率);
      伤害 = Math.trunc(baoji * 伤害 + 法球伤害 + B_player.防御 * 0.1);
      let Random = Math.random();
      if (Random < 0.06) {
        msg.push(`你找到了 ${A_player.名号} 的破绽！这一下无处可逃！`);
        伤害 *= 1.3;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·八荒剑法') > -1 &&
        cnt == 3
      ) {
        msg.push(`${B_player.名号} 使用八荒剑法【斩八荒！】`);
        伤害 *= 1.2;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 3
      ) {
        msg.push(`${B_player.名号} 使用八品·太皇经【无量仙功】开始聚集仙气`);
        伤害 *= 0.9;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·太皇经') > -1 &&
        cnt == 9
      ) {
        msg.push(`${A_player.名号} 使用八品·太皇经 聚集完成！【皇极斩！】`);
        伤害 = Math.trunc(伤害 * 1.25 + 500000);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·天星') > -1 &&
        cnt == 5
      ) {
        msg.push(`${B_player.名号} 使用天星【天动万象！】`);
        伤害 = Math.trunc(伤害 * 1.2 + 200000);
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('八品·心禅不灭诀') > -1 &&
        cnt == 5
      ) {
        msg.push(`${B_player.名号} 使用八品·心禅不灭诀【万剑归宗】`);
        伤害 *= 1.25;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('伪八品·二重梦之㱬') > -1 &&
        cnt == 7
      ) {
        msg.push(`${B_player.名号} 使用二重梦之㱬【梦轮】`);
        伤害 *= 1.25;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·避空') > -1 &&
        cnt == 5
      ) {
        msg.push(`${A_player.名号} 使用了避空【遁空！】`);
        伤害 *= 0.5;
      } else if (
        B_player.学习的功法 &&
        B_player.学习的功法.indexOf('伪九品·第一魔功') > -1 &&
        cnt == 3
      ) {
        msg.push(`${B_player.名号} 使用第一魔功【噬天！】`);
        伤害 = Math.trunc(伤害 * 1.1 + 300000);
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪九品·第一魔功') > -1 &&
        Random < 0.02
      ) {
        msg.push(
          `${A_player.名号} 使用了第一魔功【魔转！】你的伤害被转走了大部分`
        );
        伤害 *= 0.5;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('伪九品·魔帝功') > -1 &&
        Random < 0.3 &&
        cnt == 3
      ) {
        msg.push(`${A_player.名号} 使用了魔帝功【吞噬】你的伤害被吸收了`);
        伤害 *= -0.1;
      } else if (
        A_player.学习的功法 &&
        A_player.学习的功法.indexOf('八品·桃花神功') > -1 &&
        cnt == 5 &&
        Random > 0.66
      ) {
        msg.push(
          `${A_player.名号} 使用了【三生桃花！】你的攻击慢慢变成了漫天桃花飞舞。`
        );
        伤害 *= -0.2;
      } else if (Random > 0.94) {
        msg.push(`你的攻击被 ${A_player.名号} 破解了`);
        伤害 *= 0.6;
      } else if (Random > 0.9) {
        msg.push(`你的攻击被 ${A_player.名号} 接下来了`);
        伤害 *= 0.8;
      }
      伤害 = Math.trunc(伤害);
      A_player.当前血量 -= 伤害;
      if (A_player.当前血量 < 0) {
        A_player.当前血量 = 0;
      }
      msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${B_player.名号}攻击了${A_player.名号}，${ifbaoji(baoji)}造成伤害${伤害}，${
        A_player.名号
      }剩余血量${A_player.当前血量}`);
    }
    cnt++;
  }
  if (A_player.当前血量 <= 0) {
    msg.push(`${B_player.名号}击败了${A_player.名号}`);
    B_xue = B_player.当前血量 - now_B_HP;
    A_xue = -now_A_HP;
  }
  if (B_player.当前血量 <= 0) {
    msg.push(`${A_player.名号}击败了${B_player.名号}`);
    B_xue = -now_B_HP;
    A_xue = A_player.当前血量 - now_A_HP;
  }
  let Data_nattle = {
    msg: msg,
    A_xue: A_xue,
    B_xue: B_xue,
  };
  return Data_nattle;
}
