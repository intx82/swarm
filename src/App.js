import "./App.css"
import React from 'react';
import { DetailsList, SelectionMode, Icon, MessageBar, MessageBarType } from "@fluentui/react";
import { initializeIcons } from '@fluentui/font-icons-mdl2';
initializeIcons();

var mqtt = require('mqtt');
var options = {
  protocol: 'ws'
};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      devices: [],
      msg: null,
      mqttMsgPerMin: ' - '
    };
    this.availabilityTmr = null
    this.mqttMsgPerMin = 0
  }

  /**
   * Монтирует компонент - подключается к брокеру
   */
  componentDidMount() {
    this.client = mqtt.connect('mqtt://x.ks.ua:9001', options);
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
   * По ошибке
   */
  onError = () => {
    this.setState((state) => {
      state.msg = {
        type: MessageBarType.error,
        text: "Ошибка подключения"
      }

      setTimeout(() => this.setState({ msg: null }), 2500)
      return state
    })
  }

  /**
   * По подключению к брокеру
   */
  onConnect = () => {
    this.setState((state) => {
      state.msg = {
        type: MessageBarType.success,
        text: "Подключение успешно"
      }

      setTimeout(() => this.setState({ msg: null }), 2500)
      return state
    })

    this.client.subscribe('/#');
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
      // console.log(dev, "restored")
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
      setTimeout(()=>this.DevCommitMessage(devs, idx, false), 1000)
    }

    this.setState({ devices: devs })
  }

  /**
   * По входящему сообщению
   * @param {*} topic 
   * @param {*} message 
   */
  onMessage = (topic, message) => {

    let re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/\\d{3,12}')
    let devs = this.state.devices
    let devIdx = -1
    if (re.test(topic.toString())) {
      let [, hub, dev] = topic.toString().match(re).toString().split('/', 3)
      devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx === -1) {
        devIdx = devs.push({
          hub: hub,
          dev: dev,
          regTime: " - ",
          status: 0,
          lqi: 0,
          lastMsgTime: Date.now(),
        }) - 1;
        this.setDevStatusIcon(devs[devIdx], "StatusCircleCheckmark")
      } else {
        devs[devIdx].dev = dev
      }
    }

    re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/status')
    if (re.test(topic.toString())) {
      let [, hub] = topic.toString().toString().split('/', 2)
      devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx !== -1) {
        devs[devIdx].status = Number(message.toString())
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
          lastMsgTime: Date.now()
        })
        this.setDevStatusIcon(devs[devIdx-1], "StatusCircleCheckmark")
      } else {
        devs[devIdx].lastMsgTime = Date.now()
        devs[devIdx].regTime = Date.now()
        devs[devIdx].status = 0
        this.setDevStatusIcon(devs[devIdx], "StatusCircleCheckmark")
      }
    }

    this.mqttMsgPerMin = this.mqttMsgPerMin + 1;
    if (devIdx !== -1) {
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
    if ( props.item.mark ) {
      return defaultRender({...props, styles: {root: {background: '#fafaea'}}})
    }

    return defaultRender(props)
  }

  /**
   * Отрисовывает происходящее
   * @returns 
   */
  render() {
    const TblHdr = [{
      key: "alive",
      fieldName: "alive",
      name: <Icon iconName="PlugConnected" style={{fontSize: "20px"}} />,
      minWidth: 22,
      maxWidth: 22,
    }, {
      key: "hub",
      fieldName: "hub",
      name: "MAC адрес HUB",
      minWidth: 64,
      maxWidth: 480,
      isPadded: true,
      isResizable: true,
      onRender: (val) => {
        return <div className="dtListCell">{val.hub}</div>
      }
    }, {
      key: "dev",
      fieldName: "dev",
      name: "Серийный номер",
      minWidth: 64,
      maxWidth: 240,
      isPadded: true,
      isResizable: true,
      onRender: (val) => {
        return <div className="dtListCell">{val.dev}</div>
      }
    },
    {
      key: "lqi",
      fieldName: "lqi",
      name: "Уровень сигнала",
      minWidth: 64,
      maxWidth: 240,
      isPadded: true,
      isResizable: true,
      onRender: (val) => {
        return <div className="dtListCell">{val.lqi}</div>
      }
    }, {
      key: "regTime",
      fieldName: "regTime",
      name: "Время регистрации",
      minWidth: 64,
      maxWidth: 240,
      isPadded: true,
      isResizable: true,
      onRender: (dt) => {
        if (dt.regTime !== ' - ') {
          return <div className="dtListCell">{new Date(dt.regTime).toLocaleTimeString('ru-RU')}</div>
        }
        return <div className="dtListCell">{dt.regTime}</div>
      }
    }, {
      key: "lastMsgTime",
      fieldName: "lastMsgTime",
      name: "Последнее сообщение",
      minWidth: 64,
      maxWidth: 240,
      isPadded: true,
      isResizable: true,
      onRender: (dt) => {
        return <div className="dtListCell">{new Date(dt.lastMsgTime).toLocaleTimeString('ru-RU')}</div>
      }
    }, {
      key: "status",
      fieldName: "status",
      name: "Количество событий",
      minWidth: 64,
      maxWidth: 240,
      isPadded: true,
      isResizable: true,
      onRender: (val) => {
        return <div className="dtListCell">{val.status}</div>
      }
    }]

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
      
      <div style={{marginLeft: "4pt"}}>
        <small>Количество устройств: <b>{this.state.devices.length}</b> </small>
        <small>Сообщений в минуту: <b>{this.state.mqttMsgPerMin}</b> </small>
      </div>

      <DetailsList
        setKey={"devices"}
        items={this.state.devices}
        columns={TblHdr}
        selectionMode={SelectionMode.none}
        checkboxVisibility={false}
        onRenderRow={this.tblRenderRow}
        compact
      />
    </div>
  }
};

export default App;
