

import * as React from "react";
import { Accordion, AccordionSummary, AccordionDetails } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Stack, StackItem, ComboBox, Label, Spinner } from "@fluentui/react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ChartsBase from "./mqtt/charts";


/**
 * Форма для управления обновлением прошивки
 * @param {*} props
 * @returns
 */
export class DevChart extends React.Component {

    constructor(props) {
        super(props);

        this.devRegs = this.props.devState !== null ? this.props.devState['regs'] : null
        this.devType = this.devRegs !== null ? this.devRegs[15] : 0
        this.devStore = props.devState['store']
        this.options = ChartsBase.genRegsList(this.devType)
        this.chart = this.props.devState.chart

        this.state = {
            selectedReg: this.options.length === 0 ? 0 : this.options[0].key,
            interval: 0,
            evts: {},
            curEvt: 0
        }
    }

    /**
     * По от-монтированию компонента
     */
    componentWillUnmount() {
        if (this.props.clearStore && typeof this.props.clearStore === 'function') {
            this.props.clearStore(this.props.devState.idx)
        }
    }

    /**
     * Отрисовка компонента
     * @returns
     */
    render() {
        const onChangeReg = (evt, val) => {
            this.setState({ selectedReg: val.key })
        }

        const onChangeInterval = (_, val) => {

            if (val.key > 0) {
                const to = Math.trunc(Date.now() / 1000)
                const from = to - val.key
                console.log(`get Events:  ${from};${to}`)
                this.chart.getEvents(this.state.selectedReg, from, to, (evts) => {
                    this.setState((s) => {
                        s.evts[this.state.selectedReg] = ChartsBase.midEvents(evts, 60, (val.key / 60) * 1000)
                        return s
                    })
                }, (e) => {
                    this.setState({ curEvt: e })
                })
            }

            this.setState((s) => {
                if (this.state.selectedReg in this.state.evts) {
                    delete this.state.evts[this.state.selectedReg]
                }
                s.interval = val.key
                return s
            })
        }


        if (this.options.length === 0) {
            return <Label>Нет регистров для отображения</Label>
        }

        let data = []

        if (this.state.interval === 0) {
            data = ChartsBase.midEvents(this.devStore[this.state.selectedReg])
        } else if (this.chart && this.state.interval === -1) {

        } else if (this.chart) {
            if (this.state.selectedReg in this.state.evts) {
                data = this.state.evts[this.state.selectedReg]
            }
        }

        return <Stack>
            <StackItem>
                <ComboBox
                    defaultSelectedKey={this.options[0].key}
                    label="Параметр"
                    options={this.options}
                    onChange={onChangeReg}
                />
            </StackItem>

            <StackItem>
                {data.length > 0 ?
                    <LineChart width={560} height={300} data={data} margin={{ top: 10, right: 0, bottom: 5, left: 0 }} >
                        <Line type="monotone" dataKey="v" stroke="#8884d8" />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="ts" />
                        <YAxis type="number" domain={[0, ChartsBase.calcMaxVal(data)]} scale="linear" />
                        <Tooltip />
                    </LineChart> :
                    <Spinner label={`Получение данных из устройства (событие ${this.state.curEvt})`} ariaLive="assertive" labelPosition="top" />
                }
            </StackItem>

            <StackItem>
                <Accordion style={{ marginTop: "20px" }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        Настройки графика
                    </AccordionSummary>
                    <AccordionDetails>

                        <ComboBox
                            defaultSelectedKey={0}
                            label="Интервал"
                            options={[
                                { key: 0, text: "В реальном времени (следующий час)" },
                                { key: 3600, text: "За прошлый час" },
                                { key: 21600, text: "За прошедшие 6 часов" },
                                { key: 86400, text: "За прошедший день" },
                                { key: 604800, text: "За прошедшую неделю" },
                                { key: -1, text: "Указать промежуток времени" }
                            ]}
                            onChange={onChangeInterval}
                        />
                    </AccordionDetails>
                </Accordion>
            </StackItem>
        </Stack>
    }
}
