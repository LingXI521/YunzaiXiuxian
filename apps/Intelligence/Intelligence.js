
import plugin from '../../../../lib/plugins/plugin.js'

/**
 * 起哄模块
 */

/**
let message=[];
 */


export class Intelligence extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'BotHelp',
            /** 功能描述 */
            dsc: '修仙帮助',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 9999,
            rule: [
                {
                    reg: '^(打起来|你干嘛，哎哟|没意思|你好勇哦|我超勇的)$',
                    fnc: 'Intelligencemax'
                }
                /**
                 * ,
                {
                    reg: '^.*$',
                    fnc: 'Intelligencemini'
                }
                 */
                
            ]
        })
    }

    async Intelligencemax(e){
        if (!e.isGroup) {
            return;
        }
        let thing = e.msg.replace("#", '');
        let thingmax=[];
        thingmax.push("打起来","我超勇的","你干嘛，哎哟","没意思","你好勇哦");
        for(var i=0;i<thingmax.length;i++){
            if(thingmax[i]==thing){
                e.reply(thingmax[i]);
                break;
            }
        }
        return;
    }

    /**
     * 
     * 
     *     async Intelligencemini(e){
        if (!e.isGroup) {
            return;
        }
        let thing 
        try {
           thing= e.msg;
        } catch {
            return;
        }
        if(message[0]==thing){
                e.reply(message[0]);
                console.log(message);
                message.pop();
                return;
        }
        if(message[0]!=thing){
                message.pop();
                message.push(thing);
                console.log(message);
                return;
        }
    }
     * 
     * 
     */


}