
import { sha256 } from "js-sha256"

/**
 * Класс отвечающий за логику обновлений
 */
class MqttBase {

    /**
     *
     * @param {*} client
     * @param {*} dev
     * @param {*} onChunkWr
     */
    constructor(client, dev, user) {
        this.client = client
        this._dev = dev
        this._user = user
        this._hnds = {}
    }

    /**
     * Публикация сообщения
     * @param {*} topic
     * @param {*} value
     * @param {*} qos
     */
    pub(topic, value, qos = 0) {
        this.client.publish(topic, value, { qos: qos })
    }

    /**
     * Публикация сообщения с подписью пользователя
     * @param {string} topic Топик
     * @param {string} value Значение
     */
    pubDev(topic, value) {

        console.log(`publish: [ Hub: ${this._dev.hub}, Serial: ${this._dev.dev}, topic: ${topic}, Value: ${value}, user: ${this._user} ]`)
        if (this._user.hash) {
            const hmac = sha256.hmac.create(this._user.hash)
            hmac.update(String(value))
            const sign = Buffer.from(hmac.array()).toString('base64')
            value = String(value) + '.' + String(sign)
        }
        this.client.publish(`/${this._dev.hub}/${this._dev.dev}/${topic}`, value.toString())
    }

    /**
     * Устанавливает пользователя
     * @param {*} user пользователь
     */
    setUser(user) {
        this._user = user
    }

    /**
     *
     * @param {*} topic
     * @param {*} hnd
     */
    subDev(topic, hnd) {
        if (typeof (hnd) === 'function') {
            const _devTopic = `/${this._dev.hub}/${this._dev.dev}/${topic}`
            this.sub(_devTopic, (_topic, value) => {
                value = value.toString()
                
                if (value.split('.').length > 1 && this._dev.auth) {
                    hnd(_topic, value.split('.').slice(0,-1).join('.'))
                } else {
                    hnd(_topic, value)
                }
            })
        }
    }

    /**
    *
    * @param {*} topic
    * @param {*} hnd
    */
    unsubDev(topic) {
        topic = `/${this._dev.hub}/${this._dev.dev}/${topic}`
        this.unsub(topic)
    }


    /**
     * Подписка на сообщения
     * @param {string} topic
     * @param {function} onMsg Обработчик
     */
    sub(topic, onMsg) {
        console.log("Subscribe: ", topic)
        this.client.subscribe(topic)
        this._hnds[topic] = onMsg
    }

    /**
     * Отписка от сообщения
     * @param {*} topic Топик
     */
    unsub(topic) {
        if (topic in this._hnds) {
            console.log("Unsubscribe: ", topic)
            this.client.unsubscribe(topic)
            delete this._hnds[topic]
        }
    }

    /**
     * По получению сообщения
     * @param {string} topic
     * @param {string} value
     * @param {function} setProgress
     */
    onMsg(topic, value) {
        if (topic in this._hnds && typeof (this._hnds[topic]) === "function") {
            this._hnds[topic](topic, value)
        }
    }

};

export default MqttBase;