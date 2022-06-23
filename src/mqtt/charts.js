import MqttBase from "./mqtt"
import devDesc from "../devices.json";

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

    getEvents = (reg, from, to, onDone, onGetEvt, onTimeout = null, timeout = 5000) => {
        const evtTopic = `events/${reg}`
        let evtTm = `${from};${to + 1}`
        let _evts = []
        let tmr = null
        let evtCount = 0

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
                    value = JSON.parse(value)
                    value['ts'] = Number(value['ts']) * 1000

                    if (onGetEvt && typeof(onGetEvt) === 'function') {
                        onGetEvt(_evts.length)
                    }

                    _evts.push(value)
                    evtCount += 1
                } else {
                    if (_evts.length > 0 && (_evts[_evts.length - 1]['ts'] < (to * 1000)) && evtCount > 0) {
                        from = (_evts[_evts.length - 1]['ts'] / 1000) + 1
                        evtTm = `${from};${to + 1}`
                        evtCount = 0
                        this.pubDev(evtTopic, evtTm)
                    } else {
                        this.unsubDev(evtTopic)
                        onDone(_evts)
                    }
                }
            }
        })

        this.pubDev(evtTopic, evtTm)
    }

    /**
     * Получает список регистров доступных для отображения в графиках (@see charts в devices.json)
     * @param {Number} type Тип устройства
     * @returns Массив с списком регистров на отображение
     */
    static genRegsList(type) {
        if (type in devDesc) {
            const r = devDesc[type]['regs'].filter(v => v.chart).map(v => {
                return {
                    key: v.id,
                    text: v.name
                }
            })
            return r
        }
        return []
    }

    /**
     * Считает максимальное значение (верхний предел по Y в графике)
     * @param {Array[float]} data Список значений (событий)
     * @returns верхний предел по Y в графике
     */
    static calcMaxVal(data) {
        return Math.max.apply(Math, data.filter(v => v.v > 0).map(v => Number(v.v))) * (1 + Math.sqrt(5)) / 2
    }

    /**
     * Преобразовывает в float
     * @param {number} inData
     * @returns
     */
    static toFloat(inData) {
        const bFloat = new Uint8Array([
            (inData >> 24) & 0xff,
            (inData >> 16) & 0xff,
            (inData >> 8) & 0xff,
            inData & 0xff,
        ]).buffer;
        var view = new DataView(bFloat);
        return view.getFloat32(0, false).toFixed(2)
    };

    /**
     * Расширяет диапазон событий (растягивает их на 60 эл по 60000мсек)
     * @param {*} devEvents Входной список событий
     * @param {*} length Длина (по-умолчанию 60 элементов, так как в часе 60 минут)
     * @param {*} interval Интервал между событиями, по-умолчанию 60000мсек => 1минута
     * @returns Массив с событиями подготовленный для отображения
     */
    static midEvents(devEvents, length = 60, interval = 60000) {
        if (!devEvents) {
            return []
        }

        return Array.from({ length: length }, (v, k) => {

            const ts = devEvents[0]['ts'] + (interval * k)
            const val = devEvents.filter((v) => v['ts'] <= ts && v['ts'] > (ts - interval))
            let skip = devEvents.filter((v) => v['ts'] <= ts)
            skip = skip.length > 0 ? skip[skip.length - 1] : undefined

            return {
                ts: `${String(new Date(ts).getHours()).padStart(2, 0)}:${String(new Date(ts).getMinutes()).padStart(2, 0)}`,
                v: val.length > 0 ? this.toFloat(val[0]['v']) : ts <= Date.now() ? this.toFloat(skip['v']) : undefined
            }
        })
    }


};

export default ChartsBase;