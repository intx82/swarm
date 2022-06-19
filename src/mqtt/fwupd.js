import updater from "../updater"
import MqttBase from "./mqtt"

/**
 * Класс отвечающий за логику обновлений
 */
class FwUpd extends MqttBase  {

    static #UPDATER_TOPIC = "updater/"

    static UPD_STATE_IDLE = 0 /**< Состояние простоя */
    static UPD_STATE_DH = 1    /**< Состояние обмена ключами DH */
    static UPD_STATE_UPLOAD = 2 /**< Состояние обновления */

    static UPD_ERRS = [
        'OK', //0
        'Превышено количество повторов отправки', //1
        'Таймаут ответа после перезагрузки', //2
        'Таймаут записи первого пакета', //3
        'Таймаут операции переключения загрузочного сектора', //4
        'Таймаут записи данных', //5
        'Не удалось получить тип устройства', //6
        'Не удалось получить прошивку из хранилища', //7
    ]

    /**
     *
     * @param {*} client
     * @param {*} dev
     * @param {*} onChunkWr
     */
    constructor(client, dev, onChunkWr, user, onErr) {
        super(client,dev, user)
        this._state = FwUpd.UPD_STATE_IDLE
        this._fw = {}
        this._progress = 0
        this._size = 0
        this._privKey = null
        this._onChunkWr = onChunkWr
        this._onErr = onErr
        this._pubPath = `<${FwUpd.#UPDATER_TOPIC}run/${this._dev.hub}/${this._dev.dev}`
        this.sub(`>${FwUpd.#UPDATER_TOPIC}run/${this._dev.hub}/${this._dev.dev}`, this.hnd);
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
        } else if (this._state === FwUpd.UPD_STATE_DH) {
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
    hnd = (topic, value) => {
        value = value.toString()
        if (this._state === FwUpd.UPD_STATE_DH) {
            const _pubKey = updater.b642key(value)
            console.log(`Remote pub key: ${_pubKey.toString(16)}`)
            this._state = FwUpd.UPD_STATE_UPLOAD
            const shared = updater.calcSharedKey(_pubKey, this._privKey)
            console.log(`Shared key: ${shared.toString(16)}`)
            const msg = updater.composeMsg(this._fw['c'], this._user.hash)
            const ret = updater.encryptMsg(msg, shared)
            console.log(`msg: ${msg} enc: ${ret}`)
            this._state = FwUpd.UPD_STATE_UPLOAD
            this.pub(this._pubPath, ret, 1)
            this._onChunkWr(this._dev, this._fw, 1)
            return;
        }

        if (this._state === FwUpd.UPD_STATE_UPLOAD) {
            const ret = JSON.parse(value)
            if ('e' in ret || ret['p'] === -1) {
                this._onErr(this._dev, this._fw, ret)
                this._state = FwUpd.UPD_STATE_IDLE
                this._onChunkWr(this._dev, this._fw, null)
            } else {
                if ('s' in ret) {
                    this._size = Number(ret['s'])
                }
                this._progress = Number(ret['p'])

                if (this._progress < this.size) {
                    this._onChunkWr(this._dev, this._fw, this._progress)
                } else {
                    console.log('FW-Update done')
                    this._state = FwUpd.UPD_STATE_IDLE
                    this._onChunkWr(this._dev, this._fw, null)
                }
            }

            return
        }

        if (this._state === FwUpd.UPD_STATE_IDLE) {
            try {
                const ret = JSON.parse(value)
                if (ret['p'] > 0 && !('e' in ret)) {
                    if ('s' in ret) {
                        this._size = Number(ret['s'])
                    }
                    this._progress = Number(ret['p'])
                    this._state = FwUpd.UPD_STATE_UPLOAD
                    this._onChunkWr(this._dev, this._fw, this._progress)
                }
            } catch {
            }
        }
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
        this._privKey = updater.genPrivKey()
        console.log('Local private key:', this._privKey.toString(16))
        const localPubKey = updater.calcPubKey(this._privKey).toString(16)
        console.log('Local public key:', localPubKey, localPubKey.length)
        try {
            const b64PK = Buffer.from(localPubKey, 'hex').toString('base64')
            this.pub(this._pubPath, b64PK)
            this._state = FwUpd.UPD_STATE_DH
            this._user = user
            this._progress = 0
            this._fw = fw
        } catch (e) {
            console.log(e)
        }

    }
};

export default FwUpd;