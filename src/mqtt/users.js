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
     * @param {number} timeout Время таймаута ответа (60сек по-умолчанию)
     */

    getUserList = (onDone, onTimeout = null, timeout = 60000) => {

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

            if (value === '{}') {
                this.__clrTmr()
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


    /**
     * Добавляет пользователя в устройство
     * 
     * @param {*} onDone По выполненю
     * @param {*} onTimeout По таймауту
     * @param {*} timeout Время таймаута
     */
    addUser = (user, onDone, onTimeout, timeout = 5000) => {

    }

    /**
     * Удаляет пользователя из устройства
     * @param {*} user Описание пользователя
     * @param {*} onDone По выполнению
     * @param {*} onTimeout По таймауту
     * @param {*} timeout Таймаут
     */
    rmUser = (user, onDone, onTimeout, timeout = 5000) => {

    }

};

export default UsersBase;