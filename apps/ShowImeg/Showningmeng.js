import plugin from "../../../../lib/plugins/plugin.js";
import Show from "../../model/show.js";
import puppeteer from "../../../../lib/puppeteer/puppeteer.js";
import data from '../../model/XiuxianData.js'
import { __PATH } from "../Xiuxian/xiuxian.js"
import { get_gongfa_img,get_danyao_img,get_wuqi_img,get_fabao_img,get_huju_img,get_daoju_img,get_XianChong_img,get_huanying_img} from '../ShowImeg/showData.js'
/**
 * 生图模块
 */
export class Showningmeng extends plugin {
    constructor(e) {
        super({
            name: "Showningmeng",
            dsc: "修仙存档展示",
            event: "message",
            priority: 600,
            rule: [
                {
                    reg: "^#万宝楼$",
                    fnc: "show_valuables",
                },
                {
                    reg: "^#法宝楼$",
                    fnc: "Show_FaBao",
                },
                {
                    reg: "^#武器楼$",
                    fnc: "Show_WuQi",
                },
                {
                    reg: "^#护具楼$",
                    fnc: "Show_HuJu",
                },
                {
                    reg: "^#丹药楼$",
                    fnc: "Show_DanYao",
                },
                {
                    reg: "^#功法楼$",
                    fnc: "Show_GongFa",
                },
                {
                    reg: "^#道具楼$",
                    fnc: "Show_DaoJu",
                },
                 {
                    reg: "^#仙宠楼$",
                    fnc: "Show_XianChong",
                },
                {
                    reg: "^#幻影楼$",
                    fnc: "Show_HuanYing",
                },
                /*{
                    reg: "^#法宝楼$",
                    fnc: "show_valuables_fabao",
                },
                {
                    reg: "^#武器楼$",
                    fnc: "show_valuables_wuqi",
                },
                {
                    reg: "^#护具楼$",
                    fnc: "show_valuables_huju",
                },
                {
                    reg: "^#丹药楼$",
                    fnc: "show_valuables_drug",
                },
                {
                    reg: "^#功法楼$",
                    fnc: "show_valuables_skill",
                },
                {
                    reg: "^#道具楼$",
                    fnc: "show_valuables_prop",
                },*/
                {
                    reg: "^#柠檬堂(装备|丹药|功法|道具|草药|武器|护具|法宝|血量|修为|血气|天赋)?$",
                    fnc: "show_ningmenghome",
                },
                {
                    reg: '^#元素武器图鉴$',
                    fnc: 'yuansu'
                }
            ]
        });
        this.path = __PATH.player_path;
    }
    //柠檬堂
    async show_ningmenghome(e) {
         //不开放私聊功能
         if (!e.isGroup) {
            return;
        }
		let thing_type = e.msg.replace("#柠檬堂","");
        let img = await get_ningmenghome_img(e,thing_type);
        e.reply(img);
        return;
    }
    //斩首堂
    async yuansu(e) {
        //不开放私聊功能
        if (!e.isGroup) {
           return;
       }
       let img = await get_zhanshou_img(e);
       e.reply(img);
       return;
   }
    //万宝楼
    async show_valuables(e) {
         //不开放私聊功能
         if (!e.isGroup) {
            return;
        }
        let img = await get_valuables_img(e);
        e.reply(img);
        return;
    }
     //仙宠楼
     async Show_XianChong(e) {

        if (!e.isGroup) {
          return;
        }
        let img = await get_XianChong_img(e);
        e.reply(img);
        return;
    }
 //法宝楼
     async Show_FaBao(e) {

        if (!e.isGroup) {
          return;
        }
        let img = await get_fabao_img(e);
        e.reply(img);
        return;
    }

    //武器楼
    async Show_WuQi(e) {

        if (!e.isGroup) {
          return;
        }
        let img = await get_wuqi_img(e);
        e.reply(img);
        return;
    }
   
   //护具楼
   async Show_HuJu(e) {

    if (!e.isGroup) {
      return;
    }
    let img = await get_huju_img(e);
    e.reply(img);
    return;
}

    //丹药楼
    async Show_DanYao(e) {

        if (!e.isGroup) {
          return;
        }
        let img = await get_danyao_img(e);
        e.reply(img);
        return;
    }
    //功法楼
    async Show_GongFa(e) {

        if (!e.isGroup) {
          return;
        }
        let img = await get_gongfa_img(e);
        e.reply(img);
        return;
    }

    //道具楼
    async Show_DaoJu(e) {

        if (!e.isGroup) {
          return;
        }
        let img = await get_daoju_img(e);
        e.reply(img);
        return;
    }
    //幻影楼
    async Show_HuanYing(e) {

        if (!e.isGroup) {
          return;
        }
        let img = await get_huanying_img(e);
        e.reply(img);
        return;
    }
     /*//法宝楼
     async show_valuables_fabao(e) {
        //不开放私聊功能
        if (!e.isGroup) {
           return;
       }
       let img = await get_valuables_fabao_img(e);
       e.reply(img);
       return;
   }

    //武器楼
    async show_valuables_wuqi(e) {
        //不开放私聊功能
        if (!e.isGroup) {
           return;
       }
       let img = await get_valuables_wuqi_img(e);
       e.reply(img);
       return;
   } 
   
   //护具楼
   async show_valuables_huju(e) {
        //不开放私聊功能
        if (!e.isGroup) {
           return;
       }
       let img = await get_valuables_huju_img(e);
       e.reply(img);
       return;
   }

    //丹药楼
    async show_valuables_drug(e) {
         if (!e.isGroup) {
            return;
        }
        let img = await get_valuables_drug_img(e);
        e.reply(img);
        return;
    }
    //功法楼
    async show_valuables_skill(e) {
         //不开放私聊功能
         if (!e.isGroup) {
            return;
        }
        let img = await get_valuables_skill_img(e);
        e.reply(img);
        return;
    }

    //道具楼
    async show_valuables_prop(e) {
        //不开放私聊功能
        if (!e.isGroup) {
           return;
       }
       let img = await get_valuables_prop_img(e);
       e.reply(img);
       return;
   }*/
}
/**
 * 返回柠檬堂
 * @return image
 */
export async function get_ningmenghome_img(e,thing_type) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let commodities_list = data.commodities_list;
	if (thing_type!=""){
		if(thing_type=="装备"||thing_type=="丹药"||thing_type=="功法"||thing_type=="道具"||thing_type=="草药"){
			commodities_list = commodities_list.filter(item => item.class == thing_type);
		}
		else if(thing_type=="武器"||thing_type=="护具"||thing_type=="法宝"||thing_type=="修为"||thing_type=="血量"||thing_type=="血气"||thing_type=="天赋"){
			
			commodities_list = commodities_list.filter(item => item.type == thing_type);
		}
	}
    let ningmenghome_data = {
        user_id: usr_qq,
        commodities_list: commodities_list
    }
    const data1 = await new Show(e).get_ningmenghomeData(ningmenghome_data);
    let img = await puppeteer.screenshot("ningmenghome", {
        ...data1,
    });
    return img;

}
/**
 * 返回斩首堂
 * @return image
 */
 export async function get_zhanshou_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let commodities_list = data.yuansuwuqi_list;
    let ningmenghome_data = {
        user_id: usr_qq,
        commodities_list: commodities_list
    }
    const data1 = await new Show(e).get_yuansu(ningmenghome_data);
    let img = await puppeteer.screenshot("tujian", {
        ...data1,
    });
    return img;

}

/**
 * 返回万宝楼
 * @return image
 */
export async function get_valuables_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let valuables_data = {
        user_id: usr_qq
    }
    const data1 = await new Show(e).get_valuablesData(valuables_data);
    let img = await puppeteer.screenshot("valuables", {
        ...data1,
    });
    return img;
}


/**
 * 返回道具楼
 * @return image
 */
 export async function get_valuables_prop_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let daoju_list = data.daoju_list;
    let valuables_prop = {
        user_id: usr_qq,
        daoju_list: daoju_list,
    }
    const data1 = await new Show(e).get_valuables_propData(valuables_prop);
    let img = await puppeteer.screenshot("valuables_prop", {
        ...data1,
    });
    return img;
}




/**
 * 法宝楼
 * @return image
 */
export async function get_valuables_fabao_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let fabao_list = data.fabao_list;
    let valuables_fabao = {
        user_id: usr_qq,
        fabao_list: fabao_list,
    }
    const data1 = await new Show(e).get_valuables_fabaoData(valuables_fabao);
    let img = await puppeteer.screenshot("valuables_fabao", {
        ...data1,
    });
    return img;
}

/**
 * 武器楼
 * @return image
 */
 export async function get_valuables_wuqi_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let wuqi_list = data.wuqi_list;
    let valuables_wuqi = {
        user_id: usr_qq,
        wuqi_list: wuqi_list,
    }
    const data1 = await new Show(e).get_valuables_wuqiData(valuables_wuqi);
    let img = await puppeteer.screenshot("valuables_wuqi", {
        ...data1,
    });
    return img;
}
/**
 * 护具楼
 * @return image
 */
 export async function get_valuables_huju_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let huju_list = data.huju_list;
    let valuables_huju = {
        user_id: usr_qq,
        huju_list: huju_list,
    }
    const data1 = await new Show(e).get_valuables_hujuData(valuables_huju);
    let img = await puppeteer.screenshot("valuables_huju", {
        ...data1,
    });
    return img;
}




/**
 * 返回丹药楼
 * @return image
 */
export async function get_valuables_drug_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let danyao_list = data.danyao_list;
    let valuables_data = {
        user_id: usr_qq,
        danyao_list: danyao_list
    }
    const data1 = await new Show(e).get_valuables_drugData(valuables_data);
    let img = await puppeteer.screenshot("valuables_drug", {
        ...data1,
    });
    return img;
}
/**
 * 返回功法楼
 * @return image
 */
export async function get_valuables_skill_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let gongfa_list = data.gongfa_list;
    let valuables_data = {
        user_id: usr_qq,
        gongfa_list: gongfa_list
    }
    const data1 = await new Show(e).get_valuables_skillData(valuables_data);
    let img = await puppeteer.screenshot("valuables_skill", {
        ...data1,
    });
    return img;
}