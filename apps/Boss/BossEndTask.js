

import plugin from '../../../../lib/plugins/plugin.js'
import common from "../../../../lib/common/common.js"
import config from "../../model/Config.js"

/**
 * 定时任务
 */

export class BossEndTask extends plugin {
    constructor() {
        super({
            name: 'BossEndTask',
            dsc: '定时任务',
            event: 'message',
            priority: 300,
            rule: [
            ]
        });
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
        this.set = config.getdefSet('task', 'task')
        this.task = {
            cron: this.set.BossEndTask,
            name: 'BossEndTask',
            fnc: () => this.Bossendtask()
        }
    }

    async Bossendtask() {
        //boss分为金角大王、银角大王、魔王
        //魔王boss
        await redis.set("BossMaxplus", 1);
        await redis.del("BossMaxplus");
        //金角大王
        await redis.set("BossMax", 1);
        await redis.del("BossMax");
        //银角大王
        await redis.set("BossMini", 1);
        await redis.del("BossMini");
        //散兵
        await redis.set("sanbing", 1);
        await redis.del("sanbing");
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
