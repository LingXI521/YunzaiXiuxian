import plugin from '../../../../lib/plugins/plugin.js';
import fs from 'node:fs';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import { get_player_img } from '../ShowImeg/showData.js';
import {
  existplayer,
  Add_修为,
  Add_血气,
  isNotNull,
  Write_player,
  Write_najie,
  Read_equipment,
  Read_najie,
  Write_equipment,
  ForwardMsg,
  TEXT_battle,
  Read_updata_log,
  Add_HP,
  Add_najie_thing,
  exist_najie_thing,
  Reduse_player_学习功法
} from '../Xiuxian/xiuxian.js';
import { Read_Exchange, Write_Exchange } from '../Exchange/Exchange.js';
import { Read_player, __PATH } from '../Xiuxian/xiuxian.js';
import { Read_Forum, Write_Forum } from '../Help/Forum.js';
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
          reg: '^#扣修为(.*)$',
          fnc: 'xiuweiDeduction',
        },
        {
          reg: '^#发血气补偿(.*)$',
          fnc: 'xueqiFuli',
        },
        {
          reg: '^#扣血气(.*)$',
          fnc: 'xueqiDeduction',
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
        {
          reg: '^#自降修为.*$',
          fnc: 'off_xiuwei',
        },
        {
          reg: '^#自降境界至(.*)$',
          fnc: 'off_level',
        },
        {
          reg: '#将米娜桑的纳戒里叫.*的的的(装备|道具|丹药|功法|草药|材料|盒子|仙宠|口粮|项链|食材)(抹除|替换为叫.*之之之(装备|道具|丹药|功法|草药|材料|盒子|仙宠|口粮|项链|食材))$',
          fnc: 'replaceThing',
        },
      ],
    });
    this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
  }

  async off_xiuwei(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;
    //有无账号
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      return;
    }
    var number2 = e.msg.replace('#自降修为', '');
    let player = await Read_player(usr_qq);
    number2 = Math.floor(number2);
    if (number2 < 0) {
      number2 = 1000;
    }
    if (player.修为 < number2) {
      e.reply('你没有那么多修为');
      return;
    }
    Number(number2);
    if (!isNotNull(number2)) {
      e.reply('未输入数量');
      return;
    }
    if (number2 == '') {
      e.reply('你输入了个啥');
      return;
    }
    let containSpecial = new RegExp(/^[1-9]\d*$/);
    console.log(containSpecial.test(number2));
    if (!containSpecial.test(number2)) {
      e.reply('你小子');
      return;
    }
    await Add_修为(usr_qq, -number2);
    e.reply('扣除成功');
  }
  async off_level(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;
    //有无账号
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      return;
    }
    var number2 = e.msg.replace('#自降境界至', '');
    let player = await Read_player(usr_qq);
    let newjingjie = data.Level_list.find(item => item.level == number2);
    if (!isNotNull(newjingjie)) {
      e.reply('未找到' + number2 + '境界');
      return;
    }
    if (player.level_id < newjingjie.level_id) {
      e.reply('你小子');
      return;
    }
    if (newjingjie.level_id < 42 && player.level_id > 41) {
      e.reply('你想再渡一次劫？');
      return;
    }
    //境界下降,攻防血重新加载,当前血量拉满
    if (newjingjie.level_id == 1) {
      e.reply('修仙者还想回归尘世？');
      return;
    }
    let oldjingjie = data.Level_list.find(
      item => item.level_id == player.level_id
    );

    player.level_id = newjingjie.level_id;

    player.攻击 -= oldjingjie.基础攻击;
    player.防御 -= oldjingjie.基础防御;
    player.血量上限 -= oldjingjie.基础血量;
    player.暴击率 -= oldjingjie.基础暴击;
    await Write_player(usr_qq, player);
    player.攻击 += newjingjie.基础攻击;
    player.防御 += newjingjie.基础防御;
    player.血量上限 += newjingjie.基础血量;
    player.暴击率 += newjingjie.基础暴击;
    await Write_player(usr_qq, player);
    //刷新装备
    let equipment = await Read_equipment(usr_qq);
    await Write_equipment(usr_qq, equipment);
    //补血
    await Add_HP(usr_qq, 99999999);
    e.reply('扣除成功');
  }
  async liandanshi(e) {
    if (!e.isMaster) {
      e.reply('你凑什么热闹');
      return;
    }
    let File = fs.readdirSync(__PATH.player_path);
    File = File.filter(file => file.endsWith('.json'));
    let File_length = File.length;
    let action1 = [];
    let i = 0;
    for (let k = 0; k < File_length; k++) {
      let this_qq = File[k].replace('.json', '');
      this_qq = parseInt(this_qq);
      action1[i] = {
        biguan: 0, //闭关状态
        biguanxl: 0, //增加效率
        xingyun: 0,
        lianti: 0,
        ped: 0,
        modao: 0,
        beiyong1: 0,
        beiyong2: 0,
        beiyong3: 0,
        beiyong4: 0,
        beiyong5: 0,
        qq: this_qq,
      };
      i++;
    }
    await redis.set(
      'xiuxian:player:' + 10 + ':biguang',
      JSON.stringify(action1)
    );

    e.reply('更新完毕');
    return;
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
        str[j] == '闹钟' ||
        str[j] == '晓飞' ||
        str[j] == '航' 
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
          str[m - 1] !=  '晓飞' &&
          str[m - 1] !=  '航' &&
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

  // #扣修为
  async xiuweiDeduction(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    if (!e.isMaster) {
      return;
    }
    //获取发送修为数量
    let xiuweibuchang = e.msg.replace('#扣修为', '');
    const pattern = new RegExp('[0-9]+');
    if (!pattern.test(xiuweibuchang)) {
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
    await Add_修为(this_qq, -xiuweibuchang);
    e.reply(`${player.名号}被扣除${xiuweibuchang}修为`);
    return;
  }

  // 血气补偿
  async xueqiFuli(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    if (!e.isMaster) {
      return;
    }
    //获取发送修为数量
    let xueqibuchang = e.msg.replace('#', '');
    xueqibuchang = xueqibuchang.replace('发', '');
    xueqibuchang = xueqibuchang.replace('血气补偿', '');
    const pattern = new RegExp('[0-9]+');
    const str = xueqibuchang;
    if (!pattern.test(str)) {
      e.reply(`错误福利`);
      return;
    }
    //校验输入修为数
    if (
      parseInt(xueqibuchang) == parseInt(xueqibuchang) &&
      parseInt(xueqibuchang) > 0
    ) {
      xueqibuchang = parseInt(xueqibuchang);
    } else {
      xueqibuchang = 100; //没有输入正确数字或不是正数
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
    await Add_血气(this_qq, xueqibuchang);
    e.reply(`【全服公告】 ${player.名号} 获得${xueqibuchang}血气的补偿`);
    return;
  }

  // #扣血气
  async xueqiDeduction(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    if (!e.isMaster) {
      return;
    }
    //获取发送修为数量
    let xueqibuchang = e.msg.replace('#扣血气', '');
    const pattern = new RegExp('[0-9]+');
    if (!pattern.test(xueqibuchang)) {
      e.reply(`错误福利`);
      return;
    }
    //校验输入修为数
    if (
      parseInt(xueqibuchang) == parseInt(xueqibuchang) &&
      parseInt(xueqibuchang) > 0
    ) {
      xueqibuchang = parseInt(xueqibuchang);
    } else {
      xueqibuchang = 100; //没有输入正确数字或不是正数
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
    await Add_血气(this_qq, -xueqibuchang);
    e.reply(`${player.名号}被扣除${xueqibuchang}血气`);
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
    await Write_player(qq, player);
    return;
  }

  async replaceThing(e) {
    //主人判断
    if (!e.isMaster) return;
    const msg1 = e.msg.replace('#将米娜桑的纳戒里叫', '');
    const [thingName, msg2] = msg1.split('的的的');

    // #将米娜桑的纳戒里叫.*的的的(装备|道具|丹药|功法|草药|材料|盒子|仙宠|口粮|项链|食材)(抹除|替换为叫.*之之之(装备|道具|丹药|功法|草药|材料|盒子|仙宠|口粮|项链|食材))$
    if (e.msg.endsWith('抹除')) {
      const thingType = msg2.replace(/抹除$/, '');
      if (!thingName || !thingType)
        return e.reply(
          '格式错误，正确格式范例：#将米娜桑的纳戒里叫1w的的的道具替换为叫1k之之之道具'
        );
      await clearNajieThing(thingType, thingName);
      return e.reply('全部抹除完成');
    }

    // 替换为
    const N = 1; // 倍数
    const [thingType, msg3] = msg2.split('替换为叫');
    const [newThingName, newThingType] = msg3.split('之之之');
    const objArr = await clearNajieThing(thingType, thingName);
    objArr.map(uid_tnum => {
      const usrId = Object.entries(uid_tnum)[0][0];
      Add_najie_thing(usrId, newThingName, newThingType, uid_tnum.usrId * N);
    });
    return e.reply('全部替换完成');
  }
}

async function clearNajieThing(thingType, thingName) {
  if (!thingType || !thingName) return [];

  const path = './plugins/xiuxian-emulator-plugin/resources/data/xiuxian_najie';
  return fs
    .readdirSync(path)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const usrId = file.replace('.json', '');
      const najie = fs.readFileSync(`${path}/${file}`);
      const thingInNajie = JSON.parse(najie)[thingType]?.find(
        thing => thing.name == thingName
      );
      if (!thingInNajie) return false;

      let thingNumber = thingInNajie.数量;
      Add_najie_thing(usrId, thingName, thingType, -thingNumber);

      if (thingType == '装备') {
        ['劣', '普', '优', '精', '绝', '顶'].map(async pinji => {
          const thingNum = await exist_najie_thing(
            usrId,
            thingName,
            thingType,
            pinji
          );
          if (thingNum) {
            Add_najie_thing(usrId, thingName, thingType, -thingNum, pinji);
            thingNumber += thingNum;
          }
        });
      }

      return { [usrId]: thingNumber };
    })
    .filter(usrObj => usrObj);
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
    if (isNotNull(player.皮肤)) {
      player.皮肤 = undefined;
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
    if (isNotNull(player.热能)) {
      player.热能 = undefined;
    }
    if (!isNotNull(player.热量)||player.热量==null) {
      player.热量 = 0;
    }
    //补
    if (!isNotNull(najie.材料)) {
      najie.材料 = [];
    }
    if (!isNotNull(najie.食材)) {
      najie.食材 = [];
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
    if (!isNotNull(player.饱食度)) {
      player.饱食度 = 0;
    }
    if (!isNotNull(player.linggen)) {
      player.linggen = [];
    }
     if (!isNotNull(player.师徒任务阶段)) {
      player.师徒任务阶段 = 0;
    }
    if (!isNotNull(player.师徒积分)) {
      player.师徒积分 = 0;
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
    if (!isNotNull(player.熔炉)) {
      player.熔炉 = 0;
    }
    if (!isNotNull(player.附魔台)) {
      player.附魔台 = 0;
    }
    if (!isNotNull(player.书架)) {
      player.书架 = 0;
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
    if (!isNotNull(player.热能)) {
      player.热能 = 0;
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
    if (!isNotNull(player.练气皮肤)) {
      player.练气皮肤 = 0;
    }
    if (!isNotNull(player.装备皮肤)) {
      player.装备皮肤 = 0;
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
    if (!isNotNull(player.神石)) {
      player.神石 = 0;
    }
    if(player.血气==null){
      player.血气=0;
    }
    if (player.Physique_id == 0) {
      player.Physique_id = 1;
    }
    let i = 0;
    let action2 = await redis.get('xiuxian:player:' + usr_qq + ':pifu');
    action2 = JSON.parse(action2);
    action2 = 1;
    await redis.set(
      'xiuxian:player:' + usr_qq + ':pifu',
      JSON.stringify(action2)
    );
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
        beiyong1: 0, //ped
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
    najie.食材.forEach(食材 => {
      if (!isNotNull(食材.islockd)) {
        食材.islockd = 0;
      }
      食材.数量 = Math.floor(食材.数量);
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
    najie.食材 = najie.食材.filter(item => item.数量 != null || item.数量 != 0);
    najie.盒子 = najie.盒子.filter(item => item.数量 != null || item.数量 != 0);
    najie.仙宠 = najie.仙宠.filter(item => item.数量 != null || item.数量 != 0);
    najie.仙宠口粮 = najie.仙宠口粮.filter(
      item => item.数量 != null || item.数量 != 0
    );
    //1.24将纳戒中原石替换为圆石
    for (let i = 0; i < najie.材料.length; i++) {
      const element = najie.材料[i];
      if (element.name=="原石") {
        najie.材料[i].name="圆石";
        break;
      }
    }
    for (let i = 0; i < najie.道具.length; i++) {
      const element = najie.道具[i];
      if (element.name=="斧头") {
        najie.道具[i].name="木斧";
        break;
      }
    }
    for (let i = 0; i < najie.道具.length; i++) {
      const element = najie.道具[i];
      if (element.name=="天横山") {
        najie.道具[i].name="天衡山";
        break;
      }
    }
    for (let i = 0; i < najie.装备.length; i++) {
      const element = najie.装备[i];
      if (!isNotNull(element.fumo)) {
        najie.装备[i].fumo="无";
      }
    }
    for (i = 0; i < data.shicai_list.length; i++) {
      if (najie.食材.name == data.shicai_list[i].name) {
        najie.食材[i].加成=data.shicai_list[i].加成
      }
    }
                    let lingen = player.灵根.name
                    let yuansu = ["仙之心·火", "仙之心·水", "仙之心·雷", "仙之心·岩", "仙之心·冰", "仙之心·风", "仙之心·木"]
                   if(lingen == yuansu[0]||lingen  == yuansu[1]||lingen  == yuansu[2]||lingen  == yuansu[3]||lingen  == yuansu[4]||lingen == yuansu[5]||lingen == yuansu[6]){
                    let gongfa1 = ["一转轮回", "二转轮回", "三转轮回", "四转轮回", "五转轮回", "六转轮回", "七转轮回", "八转轮回", "九转轮回"];
                                   for (let i = 0; i < gongfa1.length; i++) {
                                   for(let j=0;j<=player.学习的功法.length;j++){
                      if(player.学习的功法[j]==gongfa1[i]){
                       await Reduse_player_学习功法(usr_qq, gongfa1[i]);
                      }
                      }
                       let x = await exist_najie_thing(usr_qq, gongfa1[i], "功法");
                       if (x) {
                           await Add_najie_thing(usr_qq, gongfa1[i], "功法", -x);
                       }
                   
                   }
                   if(!(lingen == yuansu[0]||lingen  == yuansu[1]||lingen  == yuansu[2]||lingen  == yuansu[3]||lingen  == yuansu[4]||lingen == yuansu[5]||lingen == yuansu[6])){
                       let gongfa = ["六稻-军略", "六稻-文伐", "六稻-金鼓", "孙子-兵势", "孙子-始计", "孙子-谋攻", "二十四篇-治军", "二十四篇-治乱", "子午谷谋","孟德新书"];
                    for (let i = 0; i < gongfa.length; i++) {
                     for(let j=0;j<=player.学习的功法.length;j++){
                      if(player.学习的功法[j]==gongfa[i]){
                       await Reduse_player_学习功法(usr_qq, gongfa[i]);
                      }
                      }
                       let x = await exist_najie_thing(usr_qq, gongfa[i], "功法");
                       if (x) {
                           await Add_najie_thing(usr_qq, gongfa[i], "功法", -x);
                       }
                   
                   }
                       
               }
                }
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
      equipment.项链 = data.necklace_list.find(item => item.name == '幸运儿');
      player.幸运 += data.necklace_list.find(
        item => item.name == '幸运儿'
      ).加成;
    }
     if(equipment.项链.属性=="幸运"){
      if (player.仙宠.type == "幸运" && player.幸运 != player.仙宠.加成+equipment.项链.加成+player.addluckyNo) {
        player.幸运 = player.仙宠.加成 + player.addluckyNo+equipment.项链.加成;
      }else if(player.仙宠.type != "幸运" && player.幸运 !=equipment.项链.加成+player.addluckyNo){
            player.幸运 = player.addluckyNo+equipment.项链.加成;
      }
      }else{
        if (player.仙宠.type == "幸运" && player.幸运 !=player.仙宠.加成+player.addluckyNo) {
          player.幸运 = player.仙宠.加成 + player.addluckyNo;
        }else if(player.仙宠.type != "幸运" && player.幸运 !=player.addluckyNo){
            player.幸运=player.addluckyNo;
        }
      }
    if (!isNotNull(equipment.武器.fumo)) {
      equipment.武器.fumo="无";
    }
    if (!isNotNull(equipment.护具.fumo)) {
      equipment.护具.fumo="无";
    }
    if (!isNotNull(equipment.法宝.fumo)) {
      equipment.法宝.fumo="无";
    }
    await Write_najie(usr_qq, najie);
    await Write_player(usr_qq, player);
    await Write_equipment(usr_qq, equipment);
  }
  e.reply('存档同步结束');

  // NOTE: 魔术师同步，开发者专用，要使用请删除注释
  const thingType = ''; // 填写欲抹除物品类型
  const thingName = ''; // 填写欲抹除物品名称

  const objArr = await clearNajieThing(thingType, thingName);
  e.reply('物品自动抹除结束');

  const newThingType = '';
  const newThingName = ''; // 填写新物品
  const N = 1; // 填写

  objArr.map(uid_tnum => {
    const usrId = Object.entries(uid_tnum)[0][0];
    Add_najie_thing(usrId, newThingName, newThingType, uid_tnum.usrId * N);
  });
  e.reply('物品自动替换结束');

  return;
}
