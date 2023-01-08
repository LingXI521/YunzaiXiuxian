//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import { Read_player,Add_灵石,Add_najie_thing,existplayer,sleep} from '../Xiuxian/xiuxian.js'


/**
 * 全局变量
 */

/**
 * 作者：DD斩首
 */
 let allaction = false;
 let t=0
export class qitao extends plugin {
    constructor() {
        super({
            name: 'qitaomokuai',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [                
                {
                    reg: "^乞讨.*",
                    fnc: "qt",
                }
            ]
        })
    }
    async qt(e){
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //全局状态判断
        await Go(e);
        if (allaction) {
        }
        else {
            return;
        }
        if(t==1){return}
        let player = await data.getData("player", usr_qq);
        let random4=Math.random()
        if(player.灵石<100){
            if(random4>0.5){
                e.reply("在大街上遇到在琉璃亭吃饭的钟大爷，他说:‘老样子，记到堂主账上吧’")
            await sleep(5000)
            e.reply("琉璃亭店主:‘你这赊的账都够把我曾曾曾曾曾曾曾孙埋了，这次不允许赊账’")
            await sleep(5000)
            e.reply("钟大爷发现在旁吃瓜的你，对你说:‘你有带灵石吗’（至少带100灵石给钟大爷付账）")
            return
            }else{
                e.reply("遇到了想喝牛奶团子的雷电影，发现你没有灵石买，人偶上号了，一刀劈了过来，幸好跑得快躲过了一劫"+'\n'+'（至少带100灵石给影买团子牛奶）')
                return 
            }
        }
        var random=Math.random()
        if(random>0.01){
            if(player.灵石>200000){
                e.reply("给DD斩首充电，花了200000灵石")
                await Add_灵石(usr_qq,-200000)
                return
            }
            if(player.灵石>100000){
                e.reply("路上碰到老奶奶摔倒在地上，好心去扶，结果反被讹了100000灵石")
                await Add_灵石(usr_qq,-100000)
                return
            }
            if(player.灵石>50000){
                e.reply("遇到喝酒没钱付账的吟游诗人，被酒馆认出你两是朋友，被迫替他付清了酒钱50000灵石")
                await Add_灵石(usr_qq,-50000)
                return
            }
            if(player.灵石>20000){
                e.reply("不知道哪里飞出来的野狗到处咬人，把你创翻在地并咬伤了你，去医院花了10000灵石")
                await Add_灵石(usr_qq,-20000)
                return
            }
            if(player.灵石>1000){
                e.reply("一群飞剑党呼得一下飞过，把你碗里的一半灵石都给抢走了，剩下一半洒落一地,你扬天长啸为何命运如此不公！！然后闪着腰了，去医院治疗花光了所有灵石")
                await Add_灵石(usr_qq,-player.灵石)
                return
            }else{
                var random3=Math.random()
                if(random3>0.5){
                    e.reply("突然有个叫虎哥的人和你说:“来小亮给他整个活！”，你不受控制得：草！走！忽略！，身上的灵石都被你后空翻甩飞了，正好一群广场舞大妈跳完广场舞路过，哄抢一通，身上一分都没有了")
                    await Add_灵石(usr_qq,-player.灵石)
                    return
                }else{
                    e.reply("你在乞讨的时候，看到有怪兽出现，此时有一位小哥说他是铠甲勇士，但是需要你给他100灵石作为能量，你把家底递给了他，谁知小哥大喊一声:铠甲勇士合体！就抱着怪兽跑了")
                    await Add_灵石(usr_qq,-player.灵石)
                    return
                }
            }


        }
        var random2=Math.random2
        if(random2>0.99){
            e.reply("水脚脚赶着去考研，飞奔而过，钱包掉落在地，正好被你捡到了")
            let thing_name="水脚脚的钱包"
            let thing_class="装备"
            let n=1
            await Add_najie_thing(usr_qq, thing_name, thing_class, n);
            return
        }
        if(random2>0.98){
            await Add_灵石(usr_qq,10000)
            e.reply("遇到坤坤演唱会，他赏给你10000灵石")
            return
        }
        if(random2>0.9){
            e.reply("乞讨了一天没有一个好心人赏你一分灵石")
            return
        }
        if(random2>0.8){
            await Add_灵石(usr_qq,5000)
            e.reply("路过的好心人设施了你5000灵石")
            return
        }
        await Add_灵石(usr_qq,1000)
        e.reply("路过的好心人设施了你1000灵石")
    }
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
        t=1
        allaction = true;
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