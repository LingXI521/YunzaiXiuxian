import plugin from '../../../../lib/plugins/plugin.js'
import config from "../../model/Config.js"
import data from '../../model/XiuxianData.js'
import fs from "fs"
import { segment } from "oicq"
import { timestampToTime, shijianc, get_random_fromARR, ForwardMsg, Getmsg_battle,get_random_talent,player_efficiency } from '../Xiuxian/xiuxian.js'
import { Add_灵石,Add_HP,Add_血气,Add_修为,Add_najie_thing, isNotNull, Read_player,exist_najie_thing } from '../Xiuxian/xiuxian.js'
import {existplayer} from "../Xiuxian/xiuxian.js";


let allaction = false;
const 宗门灵石池上限 = [2000000, 5000000, 8000000, 11000000, 15000000, 20000000];

/**
 * 洞天福地
 */
export class BlessPlace extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'BlessPlace',
            /** 功能描述 */
            dsc: '宗门驻地模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 9999,
            rule: [
                {
                    reg: '^#洞天福地列表$',
                    fnc: 'List_blessPlace'
                }, {
                    reg: '^#开采灵脉$',
                    fnc: 'exploitation_vein'
                },
                {
                    reg: '^#入驻洞天.*$',
                    fnc: 'Settled_Blessed_Place'
                },
                {
                    reg: '^#建设宗门$',
                    fnc: 'construction_Guild'
                },
                {
                    reg: '^#宗门秘境$',
                    fnc: 'mij'
                },
                {
                    reg: '^#探索宗门秘境.*$',
                    fnc: 'Go_Guild_Secrets'
                },
                {
                    reg: '^#沉迷宗门秘境.*$',
                    fnc: 'Go_Guild_Secretsplus'
                }
            
            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }






    //福地地点
    async List_blessPlace(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let addres="洞天福地";
        let weizhi = data.bless_list;
        GoBlessPlace(e,weizhi,addres);
    }

    //秘境地点
    async mij(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let addres="宗门秘境";
        let weizhi = data.guildSecrets_list;
        Goweizhi(e,weizhi,addres);
    }

    //入驻洞天
    async Settled_Blessed_Place(e){
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //用户不存在
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        //职位不符
        if (player.宗门.职位 == "宗主") {
        } else {
            e.reply("只有宗主可以操作");
            return;
        }

        let ass = data.getAssociation(player.宗门.宗门名称);


        //输入的洞天是否存在
        let  blessed_name = e.msg.replace("#入驻洞天", '');
        blessed_name = blessed_name.trim();
        //洞天不存在
        let dongTan = await data.bless_list.find(item => item.name == blessed_name);
        if (!isNotNull(dongTan)) {
            return;
        }

        if(ass.宗门驻地 == blessed_name){
            e.reply(`咋的，要给自己宗门拆了重建啊`);
            return ;
        }

        //洞天是否已绑定宗门

        let dir = data.filePathMap.association;
        let File = fs.readdirSync(dir);
        File = File.filter(file => file.endsWith(".json"));//这个数组内容是所有的宗门名称

        //遍历所有的宗门
        for (var i = 0; i < File.length; i++) {
            let this_name = File[i].replace(".json", '');
            let this_ass = await data.getAssociation(this_name);

            if(this_ass.宗门驻地==dongTan.name){
                //找到了驻地为当前洞天的宗门，说明该洞天被人占据
                //开始战力计算，抢夺洞天

                let attackPower=0;
                let defendPower=0;

                for (let i in ass.所有成员) {
                    //遍历所有成员
                    let member_qq = ass.所有成员[i];
                    //(攻击+防御+生命*0.5)*暴击率=理论战力
                    let member_data = await Read_player(member_qq);
                    let power=(member_data.攻击 + member_data.血量上限*0.5);

                    power = Math.trunc(power);
                    attackPower+=power;
                }

                for (let i in this_ass.所有成员) {
                    //遍历所有成员
                    let member_qq = this_ass.所有成员[i];
                    //(攻击+防御+生命*0.5)*暴击率=理论战力
                    let member_data = await Read_player(member_qq);
                    let power=(member_data.防御 + member_data.血量上限*0.5);

                    power = Math.trunc(power);
                    defendPower+=power;
                }

                let randomA=Math.random();
                let randomB=Math.random();
                if(randomA>0.75){
                    //进攻方状态大好，战力上升10%
                    attackPower= Math.trunc(attackPower*1.1);
                }
                if(randomA < 0.25){
                    attackPower= Math.trunc(attackPower*0.9);
                }

                if(randomB>0.75){
                    defendPower= Math.trunc(defendPower*1.1);
                }
                if(randomB < 0.25){
                    defendPower= Math.trunc(defendPower*0.9);
                }
                //防守方大阵血量加入计算
                attackPower+=ass.宗门建设等级*100+ass.大阵血量/2;
                defendPower+=this_ass.宗门建设等级*100+this_ass.大阵血量;

                if(attackPower > defendPower){
                    //抢夺成功了，更改双方驻地信息
                    this_ass.宗门驻地=ass.宗门驻地;
                    ass.宗门驻地=dongTan.name;
                    ass.宗门建设等级=this_ass.宗门建设等级;
                    if(this_ass.宗门建设等级-10<0){
                        this_ass.宗门建设等级=0
                    }else{
                        this_ass.宗门建设等级=this_ass.宗门建设等级-10;
                    }
                    this_ass.大阵血量=0
                    await data.setAssociation(ass.宗门名称, ass);
                    await data.setAssociation(this_ass.宗门名称, this_ass);
                    e.reply(`当前洞天已有宗门占据，${ass.宗门名称}造成了${attackPower}伤害！,一举攻破了${this_ass.宗门名称} ${defendPower}的防御，将对方赶了出去,占据了${dongTan.name}`);

                }
                else if(attackPower < defendPower) {
                    await data.setAssociation(this_ass.宗门名称, this_ass);
                    e.reply(`${ass.宗门名称}进攻了${this_ass.宗门名称}，对${this_ass.宗门名称}的防御造成了${attackPower}，可一瞬间${this_ass.宗门名称}的防御就回复到了${defendPower}`);
                }
                else {
                    await data.setAssociation(this_ass.宗门名称, this_ass);
                    e.reply(`${ass.宗门名称}进攻了${this_ass.宗门名称}，对${this_ass.宗门名称}的防御造成了${attackPower}，可一瞬间${this_ass.宗门名称}的防御就回复到了${defendPower}`);
                }

                return ;
            }
        }

        //到这还没返回，说明是无主洞天，直接入驻
        //宗门中写洞天信息

        ass.宗门驻地=dongTan.name;
        ass.宗门建设等级=0;
        await data.setAssociation(ass.宗门名称, ass);
        e.reply(`入驻成功,${ass.宗门名称}当前驻地为：${dongTan.name}`);
        return ;

    }

    async exploitation_vein(e){
        let usr_qq = e.user_id;
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
            return;
        }
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let player = data.getData("player", usr_qq);
        if (!isNotNull(player.宗门)) {
            return;
        }
        let ass = data.getAssociation(player.宗门.宗门名称);

        if(ass.宗门驻地==0){
            e.reply(`你的宗门还没有驻地哦，没有灵脉可以开采`);
            return ;
        }

        let now = new Date();
        let nowTime = now.getTime(); //获取当前日期的时间戳
        let Today = await shijianc(nowTime);
        let lastsign_time = await getLastsign_Explor(usr_qq);//获得上次宗门签到日期
        if (Today.Y == lastsign_time.Y && Today.M == lastsign_time.M && Today.D == lastsign_time.D) {
            e.reply(`今日已经开采过灵脉，不可以竭泽而渔哦，明天再来吧`);
            return;
        }

        if (player.当前血量 < 200) {
            e.reply("你都伤成这样了,先去疗伤吧");
            return;
        }

        //都通过了，可以进行开采了
        await redis.set("xiuxian:player:" + usr_qq + ":getLastsign_Explor", nowTime);//redis设置签到时间

        //给奖励
        let dongTan = await data.bless_list.find(item => item.name == ass.宗门驻地);

        let gift_lingshi = 0 ;


        if(ass.宗门神兽 == "麒麟"){
            gift_lingshi = 1200 *  (dongTan.level+1) * player.level_id/2;
        }else {
            gift_lingshi = 1200 *  dongTan.level * player.level_id/2;

        }
        gift_lingshi*=2
        let xf = 1;
        if(ass.power == 1){
            xf = 10;
        }
        let num =Math.trunc(gift_lingshi);
        // console.log("加数"+fuli+"宗门建设等级"+ass.宗门建设等级)
        console.log("原玩家灵石"+player.灵石+"原灵石池"+ass.灵石池)
       if (ass.灵石池 + num > (宗门灵石池上限[ass.宗门等级 - 1]) * xf) {
            ass.灵石池=(宗门灵石池上限[ass.宗门等级 - 1]) * xf;
        }else {
            ass.灵石池 += num
        }
        await Add_灵石(usr_qq,num)
        console.log("加完后灵石"+player.灵石+"加完后灵石池"+ass.灵石池)

        await data.setAssociation(ass.宗门名称, ass);
        // console.log("原灵石池加数"+num+"建设加成"+fuli+"应得两个地点灵石"+num+fuli)
        e.reply(`本次开采灵脉获得${gift_lingshi*2}灵石，上交一半给宗门，最后获得${num}灵石`);

        return ;
    }

    //降临秘境
    async Go_Guild_Secrets(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        await Go(e);
        if(!allaction){
            return ;
        }
        allaction = false;
        let player = await Read_player(usr_qq);
        let ass = data.getAssociation(player.宗门.宗门名称);
        if(ass.宗门驻地==0){
            e.reply(`你的宗门还没有驻地，不能探索秘境哦`);
            return ;
        }
        var didian = e.msg.replace("#探索宗门秘境", '');
        didian = didian.trim();
        let weizhi = await data.guildSecrets_list.find(item => item.name == didian);
        if (!isNotNull(weizhi)) {
            return;
        }

        let dongTan =ass.宗门建设等级;

        if(didian == "高级"){
            if(ass.宗门神兽 != "麒麟"){
                if(dongTan < 150){
                    e.reply(`你的宗门驻地等级不足，需要150级方可开启高级秘境`);
                    return ;
                }
            }else {
                if(dongTan < 130){
                    e.reply(`你的宗门驻地等级不够，需要130级方可开启高级秘境`);
                    return ;
                }
            }

        }
        if(didian == "中级"){
            if(ass.宗门神兽 != "麒麟"){
                if(dongTan < 100){
                    e.reply(`你的宗门驻地等级不足，需要100级方可开启高级秘境`);
                    return ;
                }
            }else {
                if(dongTan < 80){
                    e.reply(`你的宗门驻地等级不够，需要80级方可开启高级秘境`);
                    return ;
                }
            }
        }
        if(didian == "低级"){
            if(ass.宗门神兽 != "麒麟"){
                if(dongTan < 50){
                    e.reply(`你的宗门驻地等级不足，需要50级方可开启高级秘境`);
                    return ;
                }
            }else {
                if(dongTan < 30){
                    e.reply(`你的宗门驻地等级不够，需要30级方可开启高级秘境`);
                    return ;
                }
            }
        }
        if(didian == "神兽试炼"){
            if(ass.宗门神兽 != "麒麟"){
                if(dongTan < 150){
                    e.reply(`你的宗门驻地等级不足，需要150级方可开启高级秘境`);
                    return ;
                }
            }else {
                if(dongTan < 130){
                    e.reply(`你的宗门驻地等级不够，需要130级方可开启高级秘境`);
                    return ;
                }
            }
        }
        if(didian == "锻造"){
            if(ass.宗门神兽 != "麒麟"){
                if(dongTan < 130){
                    e.reply(`你的宗门驻地等级不足，需要130级方可开启高级秘境`);
                    return ;
                }
            }else {
                if(dongTan < 100){
                    e.reply(`你的宗门驻地等级不够，需要100级方可开启高级秘境`);
                    return ;
                }
            }
        }
        // if(didian == "择业"){
        //     if(ass.宗门神兽 != "麒麟"){
        //         if(dongTan < 130){
        //             e.reply(`你的宗门驻地等级不足，需要150级方可开启高级秘境`);
        //             return ;
        //         }
        //     }else {
        //         if(dongTan < 100){
        //             e.reply(`你的宗门驻地等级不够，需要130级方可开启高级秘境`);
        //             return ;
        //         }
        //     }
        // }



        if (player.灵石 < weizhi.Price) {
            e.reply("没有灵石寸步难行,攒到" + weizhi.Price + "灵石才够哦~");
            return true;
        }

        if (!isNotNull(player.level_id)) {
            e.reply("请先#同步信息");
            return;
        }

        let Price = weizhi.Price;

        ass.灵石池+=Price*0.05;
        await data.setAssociation(ass.宗门名称, ass);

        await Add_灵石(usr_qq, -Price);
        var time = this.xiuxianConfigData.CD.secretplace;//时间（分钟）
        let action_time = 60000 * time;//持续时间，单位毫秒
        let arr = {
            "action": "历练",//动作
            "end_time": new Date().getTime() + action_time,//结束时间
            "time": action_time,//持续时间
            "shutup": "1",//闭关
            "working": "1",//降妖
            "Place_action": "0",//秘境状态---开启
            "Place_actionplus": "1",//沉迷秘境状态---关闭
            "power_up": "1",//渡劫状态--关闭
            //这里要保存秘境特别需要留存的信息
            "Place_address": weizhi,
            "XF": ass.power,
        };
        if (e.isGroup) {
            arr.group_id = e.group_id
        }
        await redis.set("xiuxian:player:" + usr_qq + ":action", JSON.stringify(arr));
        // setTimeout(() => {
        //         SecretPlaceMax(e, weizhi);
        //     }, 60000 );

        e.reply("开始探索" + didian + "宗门秘境," + time + "分钟后归来!");
        return;
    }

//沉迷秘境
async Go_Guild_Secretsplus(e) {
    if (!e.isGroup) {
        return;
    }
    let usr_qq = e.user_id;
    await Go(e);
    if(!allaction){
        return ;
    }
    allaction = false;
    let player = await Read_player(usr_qq);
    let ass = data.getAssociation(player.宗门.宗门名称);
    if(ass.宗门驻地==0){
        e.reply(`你的宗门还没有驻地，不能探索秘境哦`);
        return ;
    }
    var didian = e.msg.replace("#沉迷宗门秘境", '');
    let code = didian.split("\*");
    didian = code[0];
    let i=code[1];
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        }
        else
        {
            i=code[1].replace(/[^0-9]/ig,"");
        }
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        }
    if (i>12)
        {
            return;
        }
    let weizhi = await data.guildSecrets_list.find(item => item.name == didian);
    if (!isNotNull(weizhi)) {
        return;
    }

    let dongTan =ass.宗门建设等级;

    if(didian == "高级"){
        if(ass.宗门神兽 != "麒麟"){
            if(dongTan < 150){
                e.reply(`你的宗门驻地等级不足，需要150级方可开启高级秘境`);
                return ;
            }
        }else {
            if(dongTan < 130){
                e.reply(`你的宗门驻地等级不够，需要130级方可开启高级秘境`);
                return ;
            }
        }

    }
    if(didian == "中级"){
        if(ass.宗门神兽 != "麒麟"){
            if(dongTan < 100){
                e.reply(`你的宗门驻地等级不足，需要100级方可开启高级秘境`);
                return ;
            }
        }else {
            if(dongTan < 80){
                e.reply(`你的宗门驻地等级不够，需要80级方可开启高级秘境`);
                return ;
            }
        }
    }
    if(didian == "低级"){
        if(ass.宗门神兽 != "麒麟"){
            if(dongTan < 50){
                e.reply(`你的宗门驻地等级不足，需要50级方可开启高级秘境`);
                return ;
            }
        }else {
            if(dongTan < 30){
                e.reply(`你的宗门驻地等级不够，需要30级方可开启高级秘境`);
                return ;
            }
        }
    }
    if(didian == "神兽试炼"){
        if(ass.宗门神兽 != "麒麟"){
            if(dongTan < 150){
                e.reply(`你的宗门驻地等级不足，需要150级方可开启高级秘境`);
                return ;
            }
        }else {
            if(dongTan < 130){
                e.reply(`你的宗门驻地等级不够，需要130级方可开启高级秘境`);
                return ;
            }
        }
    }
    if(didian == "锻造"){
        if(ass.宗门神兽 != "麒麟"){
            if(dongTan < 130){
                e.reply(`你的宗门驻地等级不足，需要130级方可开启高级秘境`);
                return ;
            }
        }else {
            if(dongTan < 100){
                e.reply(`你的宗门驻地等级不够，需要100级方可开启高级秘境`);
                return ;
            }
        }
    }
    // if(didian == "择业"){
    //     if(ass.宗门神兽 != "麒麟"){
    //         if(dongTan < 130){
    //             e.reply(`你的宗门驻地等级不足，需要150级方可开启高级秘境`);
    //             return ;
    //         }
    //     }else {
    //         if(dongTan < 100){
    //             e.reply(`你的宗门驻地等级不够，需要130级方可开启高级秘境`);
    //             return ;
    //         }
    //     }
    // }



    if (player.灵石 < weizhi.Price*i*10) {
        e.reply("没有灵石寸步难行,攒到" + weizhi.Price*i*10 + "灵石才够哦~");
        return true;
    }

    if (!isNotNull(player.level_id)) {
        e.reply("请先#同步信息");
        return;
    }
    let number = await exist_najie_thing(usr_qq, "秘境之匙", "道具")
    if (isNotNull(number) && number >=i) {
        await Add_najie_thing(usr_qq, "秘境之匙", "道具", -i);
    }
    else
    {
        e.reply("你没有足够数量的秘境之匙");
        return;
    }
    let Price = weizhi.Price*i*10;

    ass.灵石池+=Price*0.05;
    await data.setAssociation(ass.宗门名称, ass);

    await Add_灵石(usr_qq, -Price);
    var time = i*10*5+10;//时间（分钟）
    let action_time = 60000 * time;//持续时间，单位毫秒
    let arr = {
        "action": "历练",//动作
        "end_time": new Date().getTime() + action_time,//结束时间
        "time": action_time,//持续时间
        "shutup": "1",//闭关
        "working": "1",//降妖
        "Place_action": "1",//秘境状态---开启
        "Place_actionplus": "0",//沉迷秘境状态---关闭
        "power_up": "1",//渡劫状态--关闭
        "cishu":10*i,
        //这里要保存秘境特别需要留存的信息
        "Place_address": weizhi,
        "XF": ass.power,
    };
    if (e.isGroup) {
        arr.group_id = e.group_id
    }
    await redis.set("xiuxian:player:" + usr_qq + ":action", JSON.stringify(arr));
    // setTimeout(() => {
    //         SecretPlaceMax(e, weizhi);
    //     }, 60000 );

    e.reply("开始探索" + didian + "宗门秘境," + time + "分钟后归来!");
    return;
}
    async construction_Guild(e){
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        //用户不存在
        let ifexistplay = data.existData("player", usr_qq);
        if (!ifexistplay) {
            return;
        }
        let player = data.getData("player", usr_qq);
        //无宗门
        if (!isNotNull(player.宗门)) {
            e.reply("你尚未加入宗门");
            return;
        }
        let ass = data.getAssociation(player.宗门.宗门名称);
        if(ass.宗门驻地==0){
            e.reply(`你的宗门还没有驻地，无法建设宗门`);
            return ;
        }
        if(denji<0){
            ass.宗门建设等级=0
            denji=0
        }
        if(ass.灵石池<0){
            ass.灵石池=0
        }
        var denji=Number(ass.宗门建设等级)

        //灵石池扣除
        let lsckc = Math.trunc((denji*10000));
        if(ass.灵石池 < lsckc){
	        e.reply(`宗门灵石池不足，还需[`+lsckc+"]灵石");
        }else{
        ass.灵石池 -= lsckc
        let add = Math.trunc((player.level_id/7))
        ass.宗门建设等级+=add;
        await data.setAssociation(ass.宗门名称, ass);
        e.reply(`成功消耗 宗门${lsckc}灵石 建设宗门，增加了${add}点建设度,当前宗门建设等级为${ass.宗门建设等级}`);
        }

        return ;
    }
}


//获取上次开采灵石的时间
async function getLastsign_Explor(usr_qq) {
    //查询redis中的人物动作
    let time = await redis.get("xiuxian:player:" + usr_qq + ":getLastsign_Explor");
    if (time != null) {
        let data = await shijianc(parseInt(time))
        return data;
    }
    return false;
}
/**
 * 地点查询
 */
async function GoBlessPlace(e, weizhi, addres) {
    let adr = addres;
    let msg = [
        "***" + adr + "***"
    ];
    for (var i = 0; i < weizhi.length; i++) {
        msg.push(weizhi[i].name + "\n" + "等级：" + weizhi[i].level + "\n"  + "修炼效率：" + weizhi[i].efficiency * 100 + "%");
    }
    await ForwardMsg(e, msg);
}



async function SecretPlaceMax(e, weizhi) {
    let usr_qq = e.user_id;
    let player = await Read_player(usr_qq);
    if (player.灵根 == null || player.灵根 == undefined) {
        player.灵根 = await get_random_talent();
        player.修炼效率提升 += player.灵根.eff;
    }
    await data.setData("player", usr_qq, player);
    let A_player = {
        名号: player.名号,
        攻击: player.攻击,
        防御: player.防御,
        当前血量: player.当前血量,
        暴击率: player.暴击率,
        法球倍率: player.灵根.法球倍率
    }
    let monster_length = data.monster_list.length;
    let monster_index = Math.trunc(Math.random() * monster_length);
    let monster = data.monster_list[monster_index];
    let B_player = {
        名号: monster.名号,
        攻击: parseInt(player.攻击 * monster.攻击),
        防御: parseInt(player.防御 * monster.防御),
        当前血量: parseInt(player.血量上限 * monster.当前血量),
        暴击率: monster.暴击率,
        法球倍率: 0
    }
    let Data_battle = await Getmsg_battle(A_player, B_player);
    let msg = Data_battle.msg;
    let last_msg;
    let A_win = `${A_player.名号}击败了${B_player.名号}`;
    let B_win = `${B_player.名号}击败了${A_player.名号}`;
    let xiuwei = 0;
    var thing_name;
    var thing_class;
    var x = 1.0
    let random1 = Math.random();
    var y = 0.5;
    let random2 = Math.random();
    var z = 0.12
    let random3 = Math.random();
    let random4;
    var m = "";
    //查找秘境
    if (random1 < x) {
        if (random2 < y) {
            if (random3 < z) {
                random4 = Math.floor(Math.random() * (weizhi.three.length));
                thing_name = weizhi.three[random4].name;
                thing_class = weizhi.three[random4].class;
                m = "天地大变，金光一闪！[" + thing_name + "]从天而降";
            }
            else {
                random4 = Math.floor(Math.random() * (weizhi.two.length));
                thing_name = weizhi.two[random4].name;
                thing_class = weizhi.two[random4].class;
                m = "在洞穴中拿到[" + thing_name + "]";
            }
        }
        else {
            random4 = Math.floor(Math.random() * (weizhi.one.length));
            thing_name = weizhi.one[random4].name;
            thing_class = weizhi.one[random4].class;
            m = "捡到了[" + thing_name + "] ";
        }
    }
    else {
        random4 = Math.floor(Math.random() * (weizhi.two.length));
        thing_name = weizhi.two[random4].name;
        thing_class = weizhi.two[random4].class;
        m = "遇到了[" + thing_name + "]";
    }
    //默认结算装备数
    var n = 1;


    let now_level_id;
    if (!isNotNull(player.level_id)){
        e.reply("请先#刷新信息");
        return;
    }
    now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;

    //结算
    if (msg.find(item => item == A_win)) {
        //增加的修为
        xiuwei = parseInt((2000 + now_level_id * now_level_id));
        //存人纳戒指
        if(thing_class=="装备"){
            let pinji=['劣','普','优','精','极','绝','顶']
            let randomd=Math.floor(Math.random()*6)
            pinji=pinji[randomd]
            await Add_najie_thing(usr_qq, thing_name, thing_class, n,pinji);
        }else{
            await Add_najie_thing(usr_qq, thing_name, thing_class, n);
        }
        last_msg = m + `在历练的过程中,遇到[${B_player.名号}],经过一番战斗,击败对手,获得修为[${xiuwei}]并且在他身后的密室发现了[${thing_name}]`;
    }
    else if (msg.find(item => item == B_win)) {
        xiuwei = 1000;
        last_msg =`在历练的过程中,遇到[${B_player.名号}],经过一番战斗,败下阵来,还好跑得快,只获得了修为[${xiuwei}]`;
    }
    else {
        e.reply(`战斗过程出错`);
        return;
    }
    await Add_修为(usr_qq, xiuwei);
    await Add_HP(usr_qq, Data_battle.A_xue);
    e.reply([segment.at(usr_qq), last_msg]);
    //把情况返回
    return;
}

async function Go(e) {
    let usr_qq = e.user_id;

    //不开放私聊
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

export async function Goweizhi(e, weizhi, addres) {
    let adr = addres;
    let msg = [
        "***" + adr + "***"
    ];
    for (var i = 0; i < weizhi.length; i++) {
        msg.push(weizhi[i].name + "\n" + "等级：" + weizhi[i].Grade + "\n" + "灵石：" + weizhi[i].Price + "灵石")
    }
    await ForwardMsg(e, msg);
}