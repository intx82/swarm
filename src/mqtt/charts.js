import MqttBase from "./mqtt"


/**
 * Класс обработки запросов на получения событий устройств
 */
class ChartsBase extends MqttBase {

    /*
    constructor(client, dev, user) {
        super(client,dev, user)
    } */

    /**
     * Получает список событий
     * @param {number} reg Номер регистра
     * @param {number} from От какой точки отсчет
     * @param {number} to До какой точки отсчет
     * @param {Function} onDone вызывается по выполнению
     * @param {Function} onTimeout Вызывается по таймауту
     * @param {number} timeout Время таймаута ответа (5сек по-умолчанию)
     */

    getEvents = (reg, from, to, onDone, onTimeout = null, timeout = 5000) => {
        const evtTopic = `${reg}/events`
        const evtTm = `${from};${to}`
        let _evts = []
        let tmr = null
        if (typeof (onTimeout) === "function") {
            tmr = setInterval(onTimeout, timeout)
        }

        this.subDev(evtTopic, (topic, value) => {
            value = value.toString()
            if (value !== evtTm && typeof (onDone) === "function") {

                if (tmr !== null) {
                    clearTimeout(tmr)
                }

                if (value !== "{}") {
                    _evts.push(JSON.parse(value))
                } else {
                    this.unsub(evtTopic)
                    onDone(_evts)
                }
            }
        })

        this.pubDev(evtTopic, evtTm)
    }



};

export default ChartsBase;