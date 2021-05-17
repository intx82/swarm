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
          type : MessageBarType.error,
          text: "Ошибка подключения"
        }

        setTimeout(()=>this.setState({msg: null}), 2500)
        return state
      })
  }


  onConnect = () => {

    this.setState((state) => {
      state.msg = {
        type : MessageBarType.success,
        text: "Подключение успешно"
      }

      setTimeout(()=>this.setState({msg: null}), 2500)
      return state
    })

    this.client.subscribe('/#');
  }

  checkAvailability = () => {
    let devs = this.state.devices
    for (const idx in devs) {
      if ((devs[idx].lastMsgTime + 60000) < Date.now()) {
        devs[idx].alive = <Icon iconName="StatusCircleErrorX" style={{ color: "#a4373a" }} />
      }
    }
    this.setState({ devices: devs })
  }

  onMessage = (topic, message) => {

    let re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/\\d{3,12}')
    let devs = this.state.devices
    if (re.test(topic.toString())) {
      let [, hub, dev] = topic.toString().match(re).toString().split('/', 3)
      let devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx === -1) {
        devs.push({
          alive: <Icon iconName="StatusCircleCheckmark" style={{ color: "#31752f" }} />,
          hub: hub,
          dev: dev,
          regTime: " - ",
          status: 0,
          lastMsgTime: Date.now()
        })
      } else {
        devs[devIdx].dev = dev
        devs[devIdx].lastMsgTime = Date.now()
      }

      this.setState({ devices: devs })
    }

    re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/status')
    if (re.test(topic.toString())) {
      let [, hub] = topic.toString().toString().split('/', 2)
      let devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx !== -1) {
        devs[devIdx].status = Number(message.toString())
        devs[devIdx].lastMsgTime = Date.now()
        this.setState({ devices: devs })
      }
    }

    re = new RegExp('\\/[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}\\/time')
    if (re.test(topic.toString())) {
      let [, hub] = topic.toString().toString().split('/', 2)
      let devIdx = devs.findIndex((itm) => itm.hub === hub)
      if (devIdx === -1) {
        devs.push({
          alive: <Icon iconName="StatusCircleCheckmark" style={{ color: "#31752f" }} />,
          hub: hub,
          dev: ' - ',
          regTime: Date.now(),
          status: 0,
          lastMsgTime: Date.now()
        })
      } else {
        devs[devIdx].lastMsgTime = Date.now()
        devs[devIdx].regTime = Date.now()
        devs[devIdx].status = 0
      }
      this.setState({ devices: devs })
    }

  }

  render() {
    const TblHdr = [{
      key: "alive",
      fieldName: "alive",
      name: <Icon iconName="PlugConnected" />,
      minWidth: 16,
      maxWidth: 16,
    }, {
      key: "hub",
      fieldName: "hub",
      name: "MAC адрес HUB",
      minWidth: 64,
      maxWidth: 480,
      isPadded: true,
      isResizable: true,
    }, {
      key: "dev",
      fieldName: "dev",
      name: "Серийный номер",
      minWidth: 64,
      maxWidth: 240,
      isPadded: true,
      isResizable: true,
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
          return new Date(dt.regTime).toLocaleTimeString('ru-RU')
        }
        return dt.regTime
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
        return new Date(dt.lastMsgTime).toLocaleTimeString('ru-RU')
      }
    }, {
      key: "status",
      fieldName: "status",
      name: "Количество событий",
      minWidth: 64,
      maxWidth: 240,
      isPadded: true,
      isResizable: true,
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
