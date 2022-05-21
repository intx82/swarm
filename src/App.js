import "./App.css"
import React from 'react';
import {
    DetailsList,
    SelectionMode,
    Icon, MessageBar, MessageBarType, IconButton, Stack, mergeStyleSets, ContextualMenu,
    Link,
    Toggle
} from "@fluentui/react";

import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';

import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { FontSizes } from "@fluentui/style-utilities";
import { DevForm } from './DevForm';
import { LoginForm } from './LoginForm';
import devDesc from "./devices.json";
import ver from "./version.json"
import { sha256 } from "js-sha256"
import FwUpd from "./mqtt/fwupd"

initializeIcons();

var mqtt = require('mqtt');
var options = {
    protocol: 'wss',
    rejectUnauthorized: false
};


const contentStyles = mergeStyleSets({
    dtListCell: {
        display: "flex",
        alignItems: "center",
        height: "32px",
        fontSize: "10pt"
    }
})

const MQTT_SRV = 'wss://swarm.x.ks.ua:9001'
const UPDATER_TOPIC = ">updater/"

class App extends React.Component {

    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props) {
        super(props);

        const { cookies } = props;

        this.state = {
            devices: [],
            msg: null,
            mqttMsgPerMin: ' - ',
            DevRegs: null,
            isLoginOpen: false,
            user: {
                login: cookies.get('uid') ? cookies.get('login') : null,
                pwd: null,
                hash: cookies.get('uid') ? Buffer.from(cookies.get('uid'), 'base64') : null
            },
            devCols: [true, true, true, true, true, true, true, true, true],
            tblColsMenuShow: false,
            fwList: {}
        };
        this.tblColsMenuLinkRef = React.createRef();
        this.availabilityTmr = null
        this.mqttMsgPerMin = 0
    }

    /**
     * Монтирует компонент - подключается к брокеру
     */
    componentDidMount() {
        this.client = mqtt.connect(MQTT_SRV, options);
        this.client.on('message', this.onMessage);
        this.client.on('error', this.onError)
        this.client.on('connect', this.onConnect)
        this.availabilityTmr = setInterval(this.checkAvailability, 60000)
    }

    /**
     * Отмонтирует компонент - отключается к брокеру
     */
    componentWillUnmount() {
        if (this.availabilityTmr) {
            clearInterval(this.availabilityTmr)
        }
        this.client.end()
    }

    /**
     * По старту обновления прошивки устройства
     * @param {*} dev Описание устройства
     * @param {*} fw Описание прошивки
     * @param {*} user Описание пользователя
     * @param {*} setProgress Коллбек для установки прогресса
     */
    onFwUpdStart = (dev, fw, user) => {
        if (dev.updState instanceof FwUpd) {
            dev.updState.start(dev, fw, user)
        }
    }

    onFWUpdErr = (dev, fw, err) => {
        console.log('FW-UPD error:', err)
        this.setMsg({
            text: `Ошибка обновления ${dev.hub} ${err['e']}`,
            type: MessageBarType.error
        },5000)
    }

    /**
     * При записи куска в устройство
     * @param {*} dev Описание устройства
     * @param {*} fw Описание прошивки
     * @param {*} progress Текущее состояние дел
     */
    onFwUpdChunkWr = (dev, fw, progress) => {

        if ('setProgress' in fw && typeof(fw['setProgress']) === 'function') {
            fw['setProgress'](progress)
        }

        this.setState((state) => {
            state.devices[dev.idx].version = dev.updState.uiMsg
            return state
        })
    }

    /**
     * @brief Показывает сообщение
     * @param {*} msg Текст сообщения
     * @param {*} timeout Таймаут 
     */
    setMsg = (msg, timeout = 2500) => {
        this.setState((state) => {
            state.msg = msg
            setTimeout(() => this.setState({ msg: null }), timeout)
            return state
        })
    }

    /**
     * @brief По ошибке
     */
    onError = () => {
        this.setMsg({
            type: MessageBarType.error,
            text: "Ошибка подключения"
        })
    }

    /**
     * @brief По подключению к брокеру
     */
    onConnect = () => {
        this.setMsg({
            type: MessageBarType.success,
            text: "Подключение успешно"
        })

        this.client.subscribe('/#');
        this.client.subscribe(UPDATER_TOPIC + "list/#");
    }

    /**
     * Проверяет доступность девайса (сравнивает время) и ставит нужную иконку
     */
    checkAvailability = () => {
        let devs = this.state.devices
        for (const idx in devs) {
            if ((devs[idx].lastMsgTime + 60000) < Date.now()) {
                this.setDevStatusIcon(devs[idx], "StatusCircleErrorX")
            }
        }
        this.setState({ devices: devs, mqttMsgPerMin: this.mqttMsgPerMin })
        this.mqttMsgPerMin = 0
    }

    /**
     * Устанавливает нужную иконку
     * @param {*} dev Устройство 
     * @param {*} iconName Название иконки
     */
    setDevStatusIcon = (dev, iconName) => {
        let color = "#333333"
        const iconColors = {
            "Warning": "#ffaa44",
            "StatusCircleCheckmark": "#31752f",
            "StatusCircleErrorX": "#a4373a"
        }

        if (iconName in iconColors) {
            color = iconColors[iconName]
        }

        dev.alive = <Icon iconName={iconName} style={{ color: color, fontSize: "20px" }} />
        dev.mark = true
    }

    /**
     * Обновляет время последнего события
     * @param {*} dev Устройство
     */
    updateDevLastMsgTime = (dev) => {
        if ((dev.lastMsgTime + 60000) < Date.now()) {
            this.setDevStatusIcon(dev, "Warning")
        } else {
            this.setDevStatusIcon(dev, "StatusCircleCheckmark")
        }
        dev.lastMsgTime = Date.now()
    }

    /**
     * Отмечает колонку о том что было сообщение и 
     * запускает таймер для убирания отметки + в целом обновляет state
     * @param {*} devs 
     * @param {*} dev
     * @param {*} state Состояние
     */
    DevCommitMessage = (devs, idx, state = true) => {
        devs[idx].mark = state

        if (state) {
            this.updateDevLastMsgTime(devs[idx])
            setTimeout(() => this.DevCommitMessage(devs, idx, false), 1000)
        }

        this.setState({ devices: devs })
    }


    /**
     * По входящему сообщению
     * @param {*} topic 
     * @param {*} message 
     */
    onMessage = (topic, message) => {

        let devs = this.state.devices
        let devIdx = -1

        if (topic.toString().startsWith(`${UPDATER_TOPIC}list`)) {
            let [, , type] = topic.toString().split('/', 4)
            this.setState((state) => {
                state.fwList[type] = JSON.parse(message.toString())
                return state
            })
            return;
        }

        if (topic.toString().startsWith(`${UPDATER_TOPIC}run`)) {
            let [,, hub] = topic.toString().split('/', 3)
            devIdx = devs.findIndex((itm) => itm.hub === hub)
            if (devIdx === -1 || !devs[devIdx].updState) {
                return;
            }

            devs[devIdx].updState.onMsg(topic, message)
        }


        let re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/\\d{3,12}\\/\\d{1,3}')
        

        if (re.test(topic.toString())) {
            let [, hub, dev, reg] = topic.toString().match(re).toString().split('/', 4)
            reg = Number(reg)
            devIdx = devs.findIndex((itm) => itm.hub === hub)
            if (devIdx === -1) {
                devIdx = devs.push({
                    hub: hub,
                    dev: dev,
                    regTime: " - ",
                    status: 0,
                    lqi: 0,
                    lastMsgTime: Date.now(),
                    regs: new Array(20).fill(0),
                    auth: false,
                    mark: false,
                    type: null,
                    version: null,
                    updState: null,
                    idx: -1
                }) - 1;

                devs[devIdx].idx = devIdx
                devs[devIdx].updState = new FwUpd(this.client, devs[devIdx], this.onFwUpdChunkWr, this.state.user, this.onFWUpdErr)
                this.setDevStatusIcon(devs[devIdx], "StatusCircleCheckmark")
            } else {
                devs[devIdx].dev = dev
            }

            devs[devIdx]['regs'][0] = Number(dev)
            devs[devIdx]['regs'][reg] = Number(message.toString().split('.', 2)[0])
            devs[devIdx]['auth'] = message.toString().split('.', 2).length > 1
            console.log(`receive event: [ Hub: ${hub},Serial: ${dev}, reg: ${reg}, value: ${devs[devIdx]['regs'][reg]}, auth: ${devs[devIdx]['auth']} ]`)

            if (reg === 15) {
                const devType = devs[devIdx]['regs'][15]
                devs[devIdx].type = devDesc.hasOwnProperty(devType) ? devDesc[devType].name : null
            } else if (reg === 1) {
                devs[devIdx].regTime = new Date(devs[devIdx]['regs'][1] * 1000)
            }
        }

        re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/\\d{3,12}\\/version')
        if (re.test(topic.toString()) && !message.toString().startsWith('version')) {
            let [, hub] = topic.toString().toString().split('/', 2)
            devIdx = devs.findIndex((itm) => itm.hub === hub)
            if (devIdx !== -1) {
                devs[devIdx].version = message.toString().split('.', 2)[0]
            }
        }

        re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/\\d{3,12}\\/type')
        if (re.test(topic.toString()) && !message.toString().startsWith('type')) {
            let [, hub] = topic.toString().toString().split('/', 2)
            devIdx = devs.findIndex((itm) => itm.hub === hub)
            if (devIdx !== -1) {
                devs[devIdx]['regs'][15] = Number(message.toString().split('.', 2)[0])
                const devType = devs[devIdx]['regs'][15]
                devs[devIdx].type = devDesc.hasOwnProperty(devType) ? devDesc[devType].name : null
            }
        }

        re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/status')
        if (re.test(topic.toString())) {
            let [, hub] = topic.toString().toString().split('/', 2)
            devIdx = devs.findIndex((itm) => itm.hub === hub)
            if (devIdx !== -1) {
                devs[devIdx].status = Number(message.toString())
            } else {
                this.client.publish(`/${hub}/error`, "3")
            }
        }

        re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/lqi')
        if (re.test(topic.toString())) {
            let [, hub] = topic.toString().toString().split('/', 2)
            devIdx = devs.findIndex((itm) => itm.hub === hub)
            if (devIdx !== -1) {
                devs[devIdx].lqi = Number(message.toString())
            }
        }

        re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/time')
        if (re.test(topic.toString())) {
            let [, hub] = topic.toString().toString().split('/', 2)
            devIdx = devs.findIndex((itm) => itm.hub === hub)
            if (devIdx === -1) {
                devIdx = devs.push({
                    hub: hub,
                    dev: ' - ',
                    regTime: Date.now(),
                    status: 0,
                    lqi: 0,
                    lastMsgTime: Date.now(),
                    mark: false,
                    regs: new Array(20).fill(0),
                    auth: false,
                    type: null,
                    version: null,
                    updState: null,
                    idx: -1
                })

                devs[devIdx].updState = new FwUpd(this.client, devs[devIdx], this.onFwUpdChunkWr, this.state.user, this.onFWUpdErr)
                devs[devIdx].idx = devIdx
                this.setDevStatusIcon(devs[devIdx - 1], "StatusCircleCheckmark")
            } else {
                devs[devIdx].lastMsgTime = Date.now()
                devs[devIdx].regTime = Date.now()
                devs[devIdx].status = 0
                this.setDevStatusIcon(devs[devIdx], "StatusCircleCheckmark")
            }
        }

        this.mqttMsgPerMin = this.mqttMsgPerMin + 1;
        if (devIdx !== -1) {
            if (typeof devs[devIdx] === 'undefined') {
                console.log("Exception", devIdx, devs)
                return
            }

            this.DevCommitMessage(devs, devIdx)
        }
    }

    /**
     * Отрисовывает столбец
     * @param {*} props 
     * @param {*} defaultRender 
     * @returns 
     */
    tblRenderRow = (props, defaultRender) => {
        if (props.item.mark) {
            return defaultRender({ ...props, styles: { root: { background: '#fafaea' } } })
        }

        return defaultRender(props)
    }

    /**
     * По двойному нажатию на девайс
     * Должно открывать окно с настройками
     * @param {*} item Элмент
     */
    onShowDevWindow = (item) => {
        this.client.publish(`/${item.hub}/error`, "3")
        this.setState({ DevRegs: this.state.devices[item.idx] })
    }

    /**
     * По закрытию окна с значениями устройства
     */
    onCloseDevWindow = () => {
        document.getElementById("root").style.filter = "None"

        this.setState({
            DevRegs: null,
            isLoginOpen: false
        })
    }

    /**
     * По входу пользователя
     * 
     * @param {String} login 
     * @param {String} pwd 
     * @param {Uint8Array} hash 
     */
    onLoginUser = (login, pwd, hash) => {
        this.setState({
            user: {
                login: login,
                pwd: pwd,
                hash: hash
            }
        })
        this.onCloseDevWindow()
        this.setMsg({
            text: `Вы вошли как ${login}`,
            type: MessageBarType.info
        })
    }

    /**
     * Публикация в устройство с подписью
     * @param {Number} serial 
     * @param {String} topic 
     * @param {String} value 
     */
    publishDev = (item, topic, value) => {

        if (item) {
            console.log(`publish: [ Hub: ${item.hub}, Serial: ${item.dev}, topic: ${topic}, Value: ${value} ]`)
            if (this.state.user.hash) {
                const hmac = sha256.hmac.create(this.state.user.hash)
                hmac.update(String(value))
                const sign = Buffer.from(hmac.array()).toString('base64')
                value = String(value) + '.' + String(sign)
            }

            this.client.publish(`/${item.hub}/${item.dev}/${topic}`, value.toString())
        }
    }

    /**
     * По изменению регистра
     * @param {Number} serial Серийный номер девайса
     * @param {Number} reg Регистр
     * @param {Number} value Значение
     */
    onChangeReg = (serial, reg, value) => {
        var item = this.state.devices.find((itm) => Number(itm.dev) === serial)
        this.publishDev(item, String(reg), String(value))
    }

    /**
     * Отправляет запрос на получение версии
     */
    getVersion = (val) => {
        this.publishDev(val, 'version', 'version')
        this.setMsg({
            type: MessageBarType.info,
            text: "Запрос на получения версии устройства отправлен"
        })
    }

    /**
     * Отрисовывает происходящее
     * @returns 
     */
    render() {
        const TblHdr = [{
            enable: true,
            key: "alive",
            fieldName: "alive",
            name: <Icon iconName="PlugConnected" style={{ fontSize: "20px" }} />,
            minWidth: 22,
            maxWidth: 22,
        }, {
            enable: true,
            key: "hub",
            fieldName: "hub",
            name: "MAC адрес HUB",
            minWidth: 64,
            maxWidth: 128,
            isPadded: true,
            isResizable: true,
            onRender: (val) => {
                return <div className={contentStyles.dtListCell}>{val.hub}</div>
            }
        }, {
            enable: true,
            key: "dev",
            fieldName: "dev",
            name: "Серийный номер",
            minWidth: 64,
            maxWidth: 128,
            isPadded: true,
            isResizable: true,
            onRender: (val) => {
                return <div className={contentStyles.dtListCell}>{val.dev}</div>
            }
        }, {
            enable: true,
            key: "lqi",
            fieldName: "lqi",
            name: "Уровень сигнала",
            minWidth: 64,
            maxWidth: 128,
            isPadded: true,
            isResizable: true,
            onRender: (val) => {
                return <div className={contentStyles.dtListCell}>{val.lqi}</div>
            }
        }, {
            enable: true,
            key: "version",
            fieldName: "version",
            name: "Версия",
            minWidth: 64,
            maxWidth: 360,
            isPadded: true,
            isResizable: true,
            onRender: (val) => {
                if (val.version) {
                    return <div className={contentStyles.dtListCell}>{val.version}</div>
                }
                return <div className={contentStyles.dtListCell}> <IconButton
                    iconProps={{ iconName: "Refresh" }}
                    aria-label="Refresh"
                    onClick={() => this.getVersion(val)} /></div>
            }
        }, {
            enable: true,
            key: "type",
            fieldName: "type",
            name: "Тип устройства",
            minWidth: 64,
            maxWidth: 128,
            isPadded: true,
            isResizable: true,
            onRender: (val) => {
                if (val.type) {
                    return <div className={contentStyles.dtListCell}>{val.type}</div>
                }
                return <div className={contentStyles.dtListCell}>
                    <IconButton
                        iconProps={{ iconName: "Refresh" }}
                        aria-label="Refresh"
                        onClick={() => {
                            this.client.publish(`/${val.hub}/error`, "3")
                            this.setMsg({
                                type: MessageBarType.info,
                                text: "Запрос на получения типа устройства отправлен"
                            })
                        }}
                    />
                </div>
            }
        }, {
            enable: true,
            key: "regTime",
            fieldName: "regTime",
            name: "Время регистрации",
            minWidth: 64,
            maxWidth: 128,
            isPadded: true,
            isResizable: true,
            onRender: (dt) => {
                if (dt.regTime !== ' - ') {
                    return <div className={contentStyles.dtListCell}>{new Date(dt.regTime).toLocaleString('ru-RU')}</div>
                }
                return <div className={contentStyles.dtListCell}>
                    <IconButton
                        iconProps={{ iconName: "Refresh" }}
                        aria-label="Refresh"
                        onClick={() => {
                            this.client.publish(`/${dt.hub}/error`, "3")
                            this.setMsg({
                                type: MessageBarType.info,
                                text: "Запрос на получения время регистрации отправлен"
                            })
                        }}
                    />
                </div>
            }
        }, {
            enable: true,
            key: "lastMsgTime",
            fieldName: "lastMsgTime",
            name: "Последнее сообщение",
            minWidth: 64,
            maxWidth: 136,
            isPadded: true,
            isResizable: true,
            onRender: (dt) => {
                return <div className={contentStyles.dtListCell}>{new Date(dt.lastMsgTime).toLocaleString('ru-RU')}</div>
            }
        }, {
            enable: true,
            key: "status",
            fieldName: "status",
            name: "Количество событий",
            minWidth: 64,
            maxWidth: 128,
            isPadded: true,
            isResizable: true,
            onRender: (val) => {
                return <div className={contentStyles.dtListCell}>{val.status}</div>
            }
        }];

        return <div>
            {
                this.state.msg ?
                    <MessageBar
                        messageBarType={this.state.msg.type}
                        isMultiline={false}
                    >
                        {this.state.msg.text}
                    </MessageBar>
                    : ''
            }



            <Stack style={{ marginLeft: "4pt" }} horizontal reversed>
                <Stack.Item style={{ marginRight: "4pt" }} >
                    <IconButton
                        iconProps={{ iconName: !this.state.user.hash ? "FollowUser" : "UserRemove" }}
                        aria-label="login"
                        onClick={() => {
                            if (!this.state.user.hash) {
                                document.getElementById("root").style.filter = "blur(3px)"
                                this.setState({ isLoginOpen: true })
                            } else {
                                const { cookies } = this.props;

                                cookies.remove('uid')
                                this.setState({
                                    user: {
                                        login: null,
                                        hash: null,
                                        pwd: null
                                    }
                                })
                            }
                        }}
                    />
                </Stack.Item>
                {this.state.user.login && this.state.user.hash ?
                    <Stack.Item style={{ marginRight: "4pt", marginLeft: "4pt" }} align="center" >
                        <small>{this.state.user.login} ({Buffer.from(this.state.user.hash).toString('hex').substring(0, 8)})</small>
                    </Stack.Item> : ''}

                <Stack.Item style={{ marginRight: "4pt", marginLeft: "4pt" }} align="center">
                    <Link ref={this.tblColsMenuLinkRef} onClick={() => {
                        this.setState({ tblColsMenuShow: true })
                    }}
                        style={{
                            fontSize: "8pt"
                        }}
                    >Столбцы</Link>

                    <ContextualMenu
                        items={
                            TblHdr.map((v, i) => {
                                return {
                                    key: v.key,
                                    text: <Toggle
                                        label={v.name}
                                        inlineLabel
                                        checked={this.state.devCols[i]}
                                        onChange={(evt, checked) => {
                                            this.setState((state, props) => {
                                                state.devCols[i] = checked
                                                return state
                                            })
                                        }}
                                    />
                                }
                            })
                        }
                        target={this.tblColsMenuLinkRef}
                        hidden={!this.state.tblColsMenuShow}
                        onDismiss={() => {
                            this.setState({ tblColsMenuShow: false })
                        }}
                    />
                </Stack.Item>
                <Stack.Item grow disableShrink >&nbsp;</Stack.Item>
                <Stack.Item style={{ marginRight: "4pt", marginLeft: "4pt" }} align="center" >
                    <small>Количество устройств: <b>{this.state.devices.length}</b> </small>
                </Stack.Item>
                <Stack.Item style={{ marginRight: "4pt", marginLeft: "4pt" }} align="center">
                    <small>Сообщений в минуту: <b>{this.state.mqttMsgPerMin}</b> </small>
                </Stack.Item>
            </Stack>

            {this.state.DevRegs !== null ?
                <DevForm
                    devDesc={devDesc}
                    devState={this.state.DevRegs}
                    onCancel={this.onCloseDevWindow}
                    onChangeReg={this.onChangeReg}
                    onFwUpd={this.onFwUpdStart}
                    fwList={this.state.fwList}
                    user={this.state.user}
                    getVersion={this.getVersion}
                /> : ''}

            {this.state.isLoginOpen ?
                <LoginForm
                    isOpen={this.state.isLoginOpen}
                    onCancel={this.onCloseDevWindow}
                    onLogin={this.onLoginUser}
                /> : ''}

            <DetailsList
                setKey={"devices"}
                items={this.state.devices}
                columns={TblHdr.filter((obj, idx) => {
                    return this.state.devCols[idx]
                })}
                selectionMode={SelectionMode.none}
                checkboxVisibility={false}
                onRenderRow={this.tblRenderRow}
                onItemInvoked={this.onShowDevWindow}
                compact
            />

            <div className="ftr">
                <p style={{ fontSize: FontSizes.size10 }} >Версия: {ver}</p>
            </div>
        </div>
    }
};

export default withCookies(App);
