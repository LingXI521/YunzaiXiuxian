
import plugin from '../../../../lib/plugins/plugin.js'
import common from "../../../../lib/common/common.js"
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import fs from "node:fs"
import { segment } from "oicq"
import { isNotNull, Read_player } from "../Xiuxian/xiuxian.js"
import { Add_najie_thing,Add_职业经验 } from '../Xiuxian/xiuxian.js'

/**
 * 定时任务
 */

export class OccupationTask extends plugin {
    constructor() {
        super({
            name: 'OccupationTask',
            dsc: '定时任务',
            event: 'message',
            priority: 300,
            rule: [
            ]
        });
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
        this.set = config.getdefSet('task', 'task')
        this.task = {
            cron: this.set.action_task,
            name: 'OccupationTask',
            fnc: () => this.OccupationTask()
        }
    }

	async OccupationTask() {
        //获取缓存中人物列表
        let playerList = [];
        let files = fs
            .readdirSync("./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player")
            .filter((file) => file.endsWith(".json"));
        for (let file of files) {
            file = file.replace(".json", "");
            playerList.push(file);
        }
        for (let player_id of playerList) {
            let log_mag = "";//查询当前人物动作日志信息
            log_mag = log_mag + "查询" + player_id + "是否有动作,";
            //得到动作
            let action = await redis.get("xiuxian:player:" + player_id + ":action");
            action = JSON.parse(action);
            //不为空，存在动作
            if (action != null) {
                let push_address;//消息推送地址
                let is_group = false;//是否推送到群
                if (action.hasOwnProperty("group_id")) {
                    if (isNotNull(action.group_id)) {
                        is_group = true;
                        push_address = action.group_id;
                    }
                }
                //最后发送的消息
                let msg = [segment.at(Number(player_id))];
                //动作结束时间
                let end_time = action.end_time;
                //现在的时间
                let now_time = new Date().getTime();



                //闭关状态
                if (action.plant == "0") {
                    //这里改一改,要在结束时间的前一分钟提前结算
                    //时间过了
                     end_time=end_time-60000*2;
                    if (now_time > end_time) {
                        log_mag += "当前人物未结算，结算状态";
                        let player = data.getData("player", player_id);

                        if (!isNotNull(player.level_id)){
                            return;
                        }
						

                        let time = parseInt(action.time) / 1000 / 60;
						// let plant_amount1 = Math.floor((0.07+Math.random()*0.04)*time);
						// let plant_amount2 = Math.floor((0.07+Math.random()*0.04)*time);
						// let plant_amount3 = Math.floor((0.07+Math.random()*0.04)*time);
						// let plant_amount4 = Math.floor((0.07+Math.random()*0.04)*time);
                        let exp = 0;
                        let ext = "";
                        let rate = 0;
                        if(player.occupation=="采药师"){
                            exp = time*10;
                            rate = data.occupation_exp_list.find(item => item.id == player.occupation_level).rate*10;
                            ext = `你是采药师，获得采药经验${exp}`;
                        }
						//plant_amount1 = parseInt(plant_amount1 * time);
						//plant_amount2 = parseInt(plant_amount2 * time);
						//plant_amount3 = parseInt(plant_amount3 * time);
						//plant_amount4 = parseInt(plant_amount4 * time);
						
						// await Add_najie_thing(player_id, "人参", "草药", plant_amount1);
						// await Add_najie_thing(player_id, "何首乌", "草药", plant_amount2);
						// await Add_najie_thing(player_id, "当归", "草药", plant_amount3);
						// await Add_najie_thing(player_id, "枸杞", "草药", plant_amount4);
						await Add_职业经验(player_id,exp);
						
						
								/*凝血草 甜甜花 何首乌 清心草 血精草*/
						let res = [
							[0,0,0,0,0],
							[0,0,0,0,0],
							[0,0,0,0,0],
							[0,0,0,0,0],
							[0,0,0,0,0]
						]
						let names = ["凝血草","甜甜花","何首乌","清心草","血精草"];//可以获得的药材
						let years = ["一年","十年","百年","千年","万年"];//可以获得的品级
                        if(player.level_id<=21){
                            time=time*player.level_id/40
                            msg.push("由于你境界不足化神,在琥牢山爬上爬下总被石珀困住，挣脱花了很多时间，收入降低"+(1-player.level_id/40)*50+"%\n")
                        }else{
                            time=time*player.level_id/40
                        }

						while(time>0){//time=职业等级X采药时间(分钟)
							let plant_year = Math.random();//0到1随机一个数字
							if(plant_year<0.001*(1+rate)){//最高品质
								plant_year=4;
							}
							else if(plant_year<0.01*(1+rate)){
								plant_year=3;
							}
							else if(plant_year<0.05*(1+rate)){
								plant_year=2;
							}
							else if(plant_year<0.5*(1+rate)){
								plant_year=1;
							}
							else{
								plant_year=0;
							}
							time-=1;//一分钟加一次
							res[plant_year][Math.floor(Math.random()*5)]+=1;//数量=1到4随机数
						}
						let res_msg = "";
						for(let i=0;i<5;i++){
							for(let j=0;j<5;j++){
								if(res[i][j]>0){
									res_msg+=`\n[${years[i]}${names[j]}]×${res[i][j]}，`;
								}
                                console.log(player.id)
								await Add_najie_thing(player.id,years[i]+names[j],"草药",res[i][j]);
							}
						}
						await Add_职业经验(player_id,exp);
						msg.push(`\n采药归来，${ext}${res_msg}`);
						
						
						
						//msg.push(`\n采药归来，${ext}收获人参×${plant_amount1}，何首乌×${plant_amount2}，当归×${plant_amount3}，枸杞×${plant_amount4}`);
						
                        let arr = action;
                        //把状态都关了
                        arr.plant = 1;//闭关状态
                        arr.shutup = 1;//闭关状态
                        arr.working = 1;//降妖状态
                        arr.power_up = 1;//渡劫状态
                        arr.Place_action = 1;//秘境
                        arr.Place_actionplus = 1;//沉迷状态
                        delete arr.group_id;//结算完去除group_id
                        await redis.set("xiuxian:player:" + player_id + ":action", JSON.stringify(arr));
                        //msg.push("\n增加修为:" + xiuwei * time, "血量增加:" + blood * time);
                        if (is_group) {
                            await this.pushInfo(push_address, is_group, msg)
                        } else {
                            await this.pushInfo(player_id, is_group, msg);
                        }

                    }
                }
				if (action.mine == "0") {
                    //这里改一改,要在结束时间的前一分钟提前结算
                    //时间过了
                     end_time=end_time-60000*2;
                    if (now_time > end_time) {
                        log_mag += "当前人物未结算，结算状态";
                        let player = data.getData("player", player_id);
                        let now_level_id;
                        if (!isNotNull(player.level_id)){
                            return;
                        }
						
						// var size=this.xiuxianConfigData.mine.size;
                        let time = parseInt(action.time) / 1000 / 60;//最高480分钟
                        //以下1到5为每种的数量
						let mine_amount1 = Math.floor((1.8+Math.random()*0.4)*time);//(1.8+随机0到0.4)x时间(分钟)
						let mine_amount2 = Math.floor((1.8+Math.random()*0.4)*time);//(1.8+随机0到0.4)x时间(分钟)
						let mine_amount3 = Math.floor(time/30);//时间除30
						let mine_amount4 = Math.floor(time/30);//时间除30
						let mine_amount5 = Math.floor(time/30);//时间除30
                        let rate = data.occupation_exp_list.find(item => item.id == player.occupation_level).rate*10;
                        let exp = 0;
                        let ext = "";
                        if(player.occupation=="采矿师"){
                            exp = time*10;
                            time *= rate;
                            ext = `你是采矿师，获得采矿经验${exp}，额外获得矿石${Math.floor(rate*100)}%，`;
                        }
                        let end_amount=Math.floor(4*(rate+1)*(mine_amount1))//普通矿石
                        let end_amount2=Math.floor(4*(rate+1)*(mine_amount3))//稀有
                        if(player.level_id<=21){
            
                            end_amount*=player.level_id/40
                            end_amount2*=player.level_id/40
                            msg.push("由于你境界不足化神,在琥牢山爬上爬下总被石珀困住，挣脱花了很多时间，收入降低"+(1-player.level_id/40)*50+"%\n")
                        }else{
                            end_amount*=player.level_id/40
                            end_amount2*=player.level_id/40
                        }

                        //mine_amount1 = parseInt(mine_amount1 * time);
                        //mine_amount2 = parseInt(mine_amount2 * time);
                        //mine_amount3 = parseInt(mine_amount3 * time);
                        //mine_amount4 = parseInt(mine_amount4 * time);
                        let usr_qq=player.id
                        end_amount = Math.floor(end_amount);
                        end_amount2 = Math.floor(end_amount2);
                        await Add_najie_thing(usr_qq, "庚金", "材料", end_amount);
                        await Add_najie_thing(usr_qq, "玄土", "材料", end_amount);
                        await Add_najie_thing(usr_qq, "红宝石", "材料", end_amount2);
                        await Add_najie_thing(usr_qq, "绿宝石", "材料", end_amount2);
                        await Add_najie_thing(usr_qq, "蓝宝石", "材料", end_amount2);
                        await Add_职业经验(usr_qq,exp);
                        msg.push(`\n采矿归来，${ext}\n收获庚金×${end_amount}\n玄土×${end_amount}\n红宝石×${end_amount2}\n绿宝石×${end_amount2}\n蓝宝石×${end_amount2}`);

                        let arr = action;
                        //把状态都关了
                        arr.mine = 1;//采矿状态
                        arr.mine = 1;//闭状态
                        arr.shutup = 1;//闭关状态
                        arr.working = 1;//降妖状态
                        arr.power_up = 1;//渡劫状态
                        arr.Place_action = 1;//秘境
                        arr.Place_actionplus = 1;//沉迷状态
                        delete arr.group_id;//结算完去除group_id
                        await redis.set("xiuxian:player:" + player_id + ":action", JSON.stringify(arr));
                        //msg.push("\n增加修为:" + xiuwei * time, "血量增加:" + blood * time);
                        if (is_group) {
                            await this.pushInfo(push_address, is_group, msg)
                        } else {
                            await this.pushInfo(player_id, is_group, msg);
                        }

                    }
                }

            }
        }

    }

   
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
