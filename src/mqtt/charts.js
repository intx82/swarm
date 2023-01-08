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
        to += 600 - (to % 600)

        let evtTm = `${from};${to}`
        let _evts = []
        let tmr = null
        let evtCount = 0

        if (typeof (onTimeout) === "function") {
            tmr = setTimeout(onTimeout, timeout)
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

                    if (onGetEvt && typeof (onGetEvt) === 'function') {
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
     * Получает тип данных регистра для выбранного устройства 
     * @param {*} type 
     * @param {*} reg 
     * @returns 
     */
    static getRegType(type, reg) {
        if (type in devDesc) {
            return devDesc[type]['regs'].filter(v => v.id === reg ).map(v => {
                return v.type
            })[0]
        }
        return { "name": "float" }
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
     * @param {Number} from От какого времени идет отсчет (unixtime)
     * @param {Number} to До какого времени идет отсчет (unixtime)
     * @returns Массив с событиями подготовленный для отображения
     */
    static midEvents(devEvents, length = 60, from = null, to = null, type = "float") {
        if (!devEvents || devEvents.length === 0) {
            return []
        }

        if (to === null) {
            to = Math.trunc(devEvents[0]['ts'] / 1000) + 3600
            to += 600 - (to % 600)
        }

        if (from === null) {
            from = Math.trunc(devEvents[0]['ts'] / 1000)
            from = from -  (from % 600)
        }

        const showDate = ((to - from) / (60 * 60)) >= 12
        const intval = ((to - from) / length)

        return Array.from({ length: length }, (v, k) => {

            const cur = (from + (k * intval)) * 1000
            const prev = k > 0 ? (from + ((k - 1) * intval)) * 1000 : cur
            const next = (from + ((k + 1) * intval)) * 1000

            const itm = devEvents.filter((v) => v['ts'] >= cur && v['ts'] <= next)
            const skipVal = devEvents.filter((v) => v['ts'] < cur && v['ts'] >= prev)?.at(-1)
            
            let _itmIdx = 0
            if (itm.length > 1) {
                const _itmVal = itm.map((v, k)=>v['ts'] % 600000)
                const _itmMin = Math.min(..._itmVal)
                _itmIdx =  _itmVal.indexOf(_itmMin)
            }


            const ts = itm.length > 0 ?  itm[_itmIdx]['ts'] : cur
            const val = itm.length > 0 ? itm[_itmIdx]['v'] : skipVal ? skipVal['v'] : undefined

            let _ts = `${String(new Date(ts).getHours()).padStart(2, 0)}:${String(new Date(ts).getMinutes()).padStart(2, 0)}`;
            if (showDate) {
                _ts = `${String(new Date(ts).getDate()).padStart(2, 0)}.${String(new Date(ts).getMonth() + 1 ).padStart(2, 0)} ${_ts}`
            }

            return {
                ut: ts,
                ts: _ts,
                v: val ? (type.toLowerCase() === "float" ? this.toFloat(val) : type.toLowerCase() === "int" ? Number(val) : undefined) : val
            }
        })
    }
    
};

export default ChartsBase;