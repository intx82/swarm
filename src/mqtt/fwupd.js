import { updater } from "../updater"

/**
 * Класс отвечающий за логику обновлений
 */
class FwUpd {

    static #UPDATER_TOPIC = ">updater/"

    static UPD_STATE_IDLE = 0 /**< Состояние простоя */
    static UPD_STATE_DH = 1    /**< Состояние обмена ключами DH */
    static UPD_STATE_UPLOAD = 2 /**< Состояние обновления */

    /**
     * 
     * @param {*} client 
     * @param {*} dev 
     * @param {*} onChunkWr 
     */
    constructor(client, dev, onChunkWr) {
        this.client = client
        this._state = FwUpd.UPD_STATE_IDLE
        this._dev = dev
        this._progress = 0
        this._size = 0
        this._onChunkWr = onChunkWr
        this.sub(`${FwUpd.#UPDATER_TOPIC}run/${this._dev.hub}`);
    }

    /**
     * Публикация сообщения
     * @param {*} topic 
     * @param {*} value 
     * @param {*} qos 
     */
    pub = (topic, value, qos = 0) => {
        this.client.publish(topic, value, {qos: qos})
    }

    /**
     * Подписка на сообщения
     * @param {string} topic 
     */
    sub = (topic) => {
        this.client.subscribe(topic)
    }

    /**
     * Отдает текущее состояние обновления
     */
    get progress() {
        return this._progress
    }

    /**
     * Отдает общий размер
     */
    get size() {
        return this._size
    }

    /**
     * Отдает сообщение для UI
     */
    get uiMsg() {
        if (this._state === FwUpd.UPD_STATE_UPLOAD) {
            const updPercent = Math.round(10000 * (this.progress / this.size), 2) / 100
            return `Обновление: ${updPercent}% (${this.progress} / ${this.size})`
        } else if(this._state === FwUpd.UPD_STATE_DH) {
            return "Обмен ключами с сервером обновлений"
        } 

        return null
    }

    /**
     * Отдает текущее состояние обновления 
     * @see UPD_STATE_UPLOAD
     * @see UPD_STATE_DH
     * @see UPD_STATE_IDLE
     */
    get state() {
        return this._state
    }

    /**
     * По получению сообщения
     * @param {string} topic 
     * @param {string} value 
     * @param {function} setProgress
     */
    onMsg = (topic, value) => {
        console.log(`FW-upd ${topic} ${value}`)
    }

    /**
     * Запускает обновление
     * @param {*} dev Параметры устройства
     * @param {*} fw Параметры прошивки
     * @param {*} user Параметры пользователя
     * @param {*} onChunkWr Callback для 
     */
    start = (dev, fw, user) => {
        this._size = Number(fw['s'])

        this._state = FwUpd.UPD_STATE_DH
        this._progress = 0
        const step = () => {
            this._state = FwUpd.UPD_STATE_UPLOAD
            this._onChunkWr(dev, fw, this._progress)
            this._progress += 1
            if (this._progress <= this.size) {
                setTimeout(step, 50);
            } else {
                this._state = FwUpd.UPD_STATE_IDLE
                this._onChunkWr(dev, fw, null)
            }
        };

        setTimeout(step, 500);
    }
};

export default FwUpd;