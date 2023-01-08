

import plugin from '../../../../lib/plugins/plugin.js'
import common from "../../../../lib/common/common.js"
import config from "../../model/Config.js"
import data from '../../model/XiuxianData.js'
import fs from "node:fs"
import { Read_player,isNotNull } from '../Xiuxian/xiuxian.js'


/**
 * 定时任务
 */

export class BossTask extends plugin {
    constructor() {
        super({
            name: 'BossTask',
            dsc: '定时任务',
            event: 'message',
            priority: 300,
            rule: [
            ]
        });
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
        this.set = config.getdefSet('task', 'task')
        this.task = {
            cron: this.set.BossTask,
            name: 'BossTask',
            fnc: () => this.Bosstask()
        }
    }

    async Bosstask() {
        let User_maxplus = 1;//所有仙人数
        User_maxplus = Number(User_maxplus);
        let User_max = 1;//所有高段
        User_max = Number(User_max);
        let User_mini = 1;//所有低段
        User_mini = Number(User_mini);
        let playerList = [];
        let files = fs
            .readdirSync("./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player")
            .filter((file) => file.endsWith(".json"));
        for (let file of files) {
            file = file.replace(".json", "");
            playerList.push(file);
        }
        for (let player_id of playerList) {
            let usr_qq = player_id;
            //读取信息
            let player = await Read_player(usr_qq);
            let now_level_id;
            if (!isNotNull(player.level_id)){
                return;
            }
            now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
            
            if (now_level_id >= 42) {
                User_maxplus++;
            }
            else if (now_level_id > 21&&now_level_id < 42) {
                User_max++;
            }
            else {
                User_mini++;
            }
        }
        //打一下多少灵石
        //魔王初始化
        let money = 1000*this.xiuxianConfigData.Boss.Boss;
        let attack = money*2;
        let defense = money*2;
        let blood = money*2;
        //限制最高人数
        if(User_maxplus>=30){
            User_maxplus=30;
        }
        //这里判断一下，为1就不丢数据了。
        await redis.set("BossMaxplus", 1);
        if (User_maxplus != 1) {
            //初始化属性
            let BossMaxplus = {
                "name": "魔王",
                "attack": attack * User_maxplus*3,
                "defense": defense * User_maxplus*3,
                "blood": blood * User_maxplus*3,
                "probability": "0.7",
                "money": money * User_maxplus*3,
                "linggen":"仙之心·水"
                    
            };
            //redis初始化
            await redis.set("xiuxian:BossMaxplus", JSON.stringify(BossMaxplus));
            await redis.set("BossMaxplus", 0);
        }
        if(User_max>=25){
            User_max=25;
        }
        await redis.set("BossMax", 1);
        if (User_max != 1) {
            //初始化属性
            let BossMax = {
                "name": "金角大王",
                "attack": attack * User_max*2,
                "defense": defense * User_max*2,
                "blood": blood * User_max*2,
                "probability": "0.5",
                "money": money * User_max*2,
                "linggen":"仙之心·火"
                
            };
            //redis初始化
            await redis.set("xiuxian:BossMax", JSON.stringify(BossMax));
            //金角大王
            await redis.set("BossMax", 0);
        }
        if(User_mini>=20){
            User_mini=20;
        }
        await redis.set("BossMini", 1);
        if (User_mini != 1) {
            //初始化属性
            let BossMini = {
                "name": "银角大王",
                "attack": attack * User_mini,
                "defense": defense * User_mini,
                "blood": blood * User_mini,
                "probability": "0.3",
                "money": money * User_mini,
                "linggen":"仙之心·风"
                
            };
            //redis初始化
            await redis.set("xiuxian:BossMini", JSON.stringify(BossMini));
            //银角大王
            await redis.set("BossMini", 0);
        }
        return;
    }


    /**
     * 推送消息，群消息推送群，或者推送私人
     * @param id
     * @param is_group
     * @returns {Promise<void>}
     */
    async pushInfo(id, is_group, msg) {
        if (is_group) {
            await Bot.pickGroup(id)
                .sendMsg(msg)
                .catch((err) => {
                    Bot.logger.mark(err);
                });
        }
        else {
            await common.relpyPrivate(id, msg);
        }
    }
}
