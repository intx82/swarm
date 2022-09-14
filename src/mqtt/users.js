import MqttBase from "./mqtt"


const USER_LIST_TOPIC = 'user/list'
const USER_LIST_CMD = 'list'

const USER_ADD_TOPIC = 'user/add'
const USER_RM_TOPIC = 'user/remove'


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
                this.unsubDev(USER_LIST_TOPIC)
                if (typeof (onDone) === 'function') {
                    onDone(_users)
                }
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
    addUser = (user, onDone, onTimeout, timeout = 10000) => {
        const _user = new Uint8Array(user['u'].length + 1 + user['n'].length + 1);
        _user.set(user['u'])
        _user[32] = user['p']
        _user[33] = user['n'].length
        _user.set(Buffer.from(user['n']),34)

        this.__setTmr(() => {
            this.unsubDev(USER_ADD_TOPIC)
            onTimeout?.();
        }, timeout)

        this.subDev(USER_ADD_TOPIC, (top, value) => {
            value = value.toString()
            if (value === Buffer.from(_user).toString('base64')) {
                return;
            }

            this.unsubDev(USER_ADD_TOPIC)
            this.__clrTmr()
            onDone?.(value)

        })

        this.pubDev(USER_ADD_TOPIC, Buffer.from(_user).toString('base64'))
    }

    /**
     * Удаляет пользователя из устройства
     * @param {*} user Описание пользователя
     * @param {*} onDone По выполнению
     * @param {*} onTimeout По таймауту
     * @param {*} timeout Таймаут
     */
    rmUser = (user, onDone, onTimeout, timeout = 5000) => {
        const _user = Buffer.from(user['u'], 'hex').toString('base64')
        console.warn('remove user: ', user)

        this.__setTmr(() => {
            this.unsubDev(USER_RM_TOPIC)
            onTimeout?.();
        }, timeout)

        this.subDev(USER_RM_TOPIC, (top, value) => {
            value = value.toString()
            console.log(value)

            if (value === _user) {
                return;
            }

            this.unsubDev(USER_RM_TOPIC)

            this.__clrTmr()
            onDone?.(value)
        })

        this.pubDev(USER_RM_TOPIC, _user)
    }

};

export default UsersBase;