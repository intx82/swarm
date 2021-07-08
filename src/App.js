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
      msg: null
    };
    this.availabilityTmr = null
  }

  componentDidMount() {
    this.client = mqtt.connect('mqtt://x.ks.ua:9001', options);
    this.client.on('message', this.onMessage);
    this.client.on('error', this.onError)
    this.client.on('connect', this.onConnect)
    this.availabilityTmr = setInterval(this.checkAvailability, 62000)
  }

  componentWillUnmount() {
    if (this.availabilityTmr) {
      clearInterval(this.availabilityTmr)
    }
    this.client.end()
  }

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

  checkAvailability = () => {
    let devs = this.state.devices
    for (const idx in devs) {
      if ((devs[idx].lastMsgTime + 60000) < Date.now()) {
        this.setDevStatusIcon(devs[idx], "StatusCircleErrorX")
      }
    }
    this.setState({ devices: devs })
  }

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
  }

  updateDevLastMsgTime = (dev) => {
    if ((dev.lastMsgTime + 60000) < Date.now()) {
      console.log(dev, "restored")
      this.setDevStatusIcon(dev, "Warning")
    } else {
      this.setDevStatusIcon(dev, "StatusCircleCheckmark")
    }
    dev.lastMsgTime = Date.now()
  }

  onMessage = (topic, message) => {

    let re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/\\d{3,12}')
    let devs = this.state.devices
    if (re.test(topic.toString())) {
      let [, hub, dev] = topic.toString().match(re).toString().split('/', 3)
      let devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx === -1) {
        devIdx = devs.push({
          hub: hub,
          dev: dev,
          regTime: " - ",
          status: 0,
          lqi: 0,
          lastMsgTime: Date.now()
        }) - 1;
        this.setDevStatusIcon(devs[devIdx], "StatusCircleCheckmark")
      } else {
        devs[devIdx].dev = dev
        this.updateDevLastMsgTime(devs[devIdx])
      }

      this.setState({ devices: devs })
    }

    re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/status')
    if (re.test(topic.toString())) {
      let [, hub] = topic.toString().toString().split('/', 2)
      let devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx !== -1) {
        devs[devIdx].status = Number(message.toString())
        this.updateDevLastMsgTime(devs[devIdx])
        this.setState({ devices: devs })
      }
    }

    re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/lqi')
    if (re.test(topic.toString())) {
      let [, hub] = topic.toString().toString().split('/', 2)
      let devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx !== -1) {
        devs[devIdx].lqi = Number(message.toString())
        this.updateDevLastMsgTime(devs[devIdx])
        this.setState({ devices: devs })
      }
    }

    re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/time')
    if (re.test(topic.toString())) {
      let [, hub] = topic.toString().toString().split('/', 2)
      let devIdx = devs.findIndex((itm) => itm.hub === hub)
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
      this.setState({ devices: devs })
    }

  }

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
      <div style={{marginLeft: "4pt"}}><small>Количество устройств: <b>{this.state.devices.length}</b></small></div>
      <DetailsList
        setKey={"devices"}
        items={this.state.devices}
        columns={TblHdr}
        selectionMode={SelectionMode.none}
        checkboxVisibility={false}
        compact
      />
    </div>
  }
};

export default App;
