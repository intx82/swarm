import MqttBase from "./mqtt"


const USER_LIST_TOPIC = 'user/list'
const USER_LIST_CMD = 'list'


/**
 * Класс обработки запросов на получения списка пользователей / добавление пользователей
 */
class UsersBase extends MqttBase {


    constructor(client, dev, user) {
        super(client, dev, user)
        this._tmr = null
    }


    __setTmr(onTimeout, timeout = 5000) {
        if (!this._tmr) {
            this._tmr = setTimeout(() => {
                if (typeof (onTimeout) === "function") {
                    onTimeout()
                }
            }, timeout)
        }
    }

    __clrTmr() {
        if (this._tmr) {
            clearTimeout(this._tmr)
            this._tmr = null
        }
    }

    /**
     * Получает список пользователей
     * @param {Function} onDone вызывается по выполнению
     * @param {Function} onTimeout Вызывается по таймауту
     * @param {number} timeout Время таймаута ответа (5сек по-умолчанию)
     */

    getUserList = (onDone, onTimeout = null, timeout = 30000) => {

        const _users = []
        this.__setTmr(() => {
            this.unsubDev(USER_LIST_TOPIC)
            onTimeout?.();
        }, timeout)

        this.subDev(USER_LIST_TOPIC, (top, value) => {

            value = value.toString()
            if (value === USER_LIST_CMD) {
                return;
            }

            this.__clrTmr()

            if (value === '{}') {
                if (typeof (onDone) === 'function') {
                    onDone(_users)
                }
                this.unsubDev(USER_LIST_TOPIC)
            } else {
                try {
                    value = JSON.parse(value)
                    _users.push(value)
                } catch {
                    console.log('Could not parse return value: ', value)
                }
            }
        })

        this.pubDev(USER_LIST_TOPIC, USER_LIST_CMD)
    }

};

export default UsersBase;