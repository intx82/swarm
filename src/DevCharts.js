

import * as React from "react";
import { Accordion, AccordionSummary, AccordionDetails } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Stack, StackItem, ComboBox, Label, Spinner, DatePicker, TimePicker, defaultDatePickerStrings, PrimaryButton } from "@fluentui/react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ChartsBase from "./mqtt/charts";


function DateTimePicker(props) {

    const [dt, setDt] = React.useState(0)
    const [tm, setTm] = React.useState(1800)

    function onChangeDate(_dt) {
        setDt(_dt.getTime())

        if (props.onChange && typeof (props.onChange) === 'function') {
            props.onChange(new Date(_dt.getTime() + tm * 1000))
        }
    }

    function onChangeTime(_, val) {
        if (val) {
            const _tm = val.text.toString().split(':')
            if (_tm.length >= 2) {
                const secs = _tm.map(v => Number(v)).reduce((p, v) => p = (p * 60) + v) * 60
                setTm(secs)
                if (props.onChange && typeof (props.onChange) === 'function') {
                    props.onChange(new Date(dt + secs * 1000))
                }
            }
        }
    }

    const itemStyles = {
        alignItems: 'center',
        justifyContent: 'center',
        width: '240pt'
    };

    return <Stack horizontal tokens={{
        childrenGap: 5,
        padding: 0,
    }} style={{
        overflow: 'hidden',
        width: '100%',
        marginTop: '2pt'
    }}>
        <StackItem grow style={itemStyles}>
            <DatePicker style={{ width: '100%' }}
                onSelectDate={onChangeDate}
                {...props.DateProps} />
        </StackItem>
        <StackItem grow style={itemStyles}>
            <TimePicker style={{ width: '100%' }}
                onChange={onChangeTime}
                timeRange={{
                    start: 0,
                    end: 24
                }}
                useComboBoxAsMenuWidth={true}
                {...props.TimeProps} />
        </StackItem>
    </Stack>
}


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

        if (this.props.user) {
            this.chart.setUser(this.props.user)
        }

        this.state = {
            selectedReg: this.options.length === 0 ? 0 : this.options[0].key,
            from: 0,
            to: 0,
            chartSelector: 0,
            evts: {},
            curEvt: 0,
            showDatePicker: false
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


        const retrieveData = (from, to) => {
            console.log(`get Events:  ${from};${to} (${(to - from) / 60})`)
            this.chart.getEvents(this.state.selectedReg, from, to, (evts) => {
                this.setState((s) => {
                    s.evts[this.state.selectedReg] = ChartsBase.midEvents(evts, 60, from, to)
                    return s
                })
            }, (e) => {
                if (e % 32 === 0) {
                    this.setState({
                        curEvt: e
                    })
                }
            })

            this.setState((s) => {
                if (this.state.selectedReg in this.state.evts) {
                    delete s.evts[this.state.selectedReg]
                }
                s.to = to
                s.from = from
                return s
            })
        }

        const onChangeInterval = (_, val) => {
            const intval = val.key
            this.setState({
                chartSelector: intval,
            })

            if (intval > 0) {
                const to = Math.trunc(Date.now() / 1000)
                retrieveData(to - intval, to)
            } else if (intval === 0) {
                this.setState({
                    from: 0,
                    to: 0
                })
            }
        }


        if (this.options.length === 0) {
            return <Label>Нет регистров для отображения</Label>
        }

        let data = []

        if (this.state.from === 0 && this.state.to === 0) {
            data = ChartsBase.midEvents(this.devStore[this.state.selectedReg], 60)
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
                    this.state.chartSelector === -1 ?
                    <Label>Нет данных для отображения</Label> :
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
                        <Stack style={{
                            overflow: 'hidden',
                            width: '100%',
                        }}>
                            <StackItem grow>
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
                            </StackItem>
                            {
                                this.state.chartSelector === -1 ? <StackItem grow>
                                    <DateTimePicker
                                        DateProps={{
                                            placeholder: "Дата начала",
                                            allowTextInput: false,
                                            ariaLabel: 'Start date',
                                            strings: defaultDatePickerStrings
                                        }}
                                        onChange={(dt) => {
                                            this.setState({
                                                from: Math.trunc(dt.getTime() / 1000)
                                            })
                                        }}
                                    />
                                </StackItem> : ""
                            }

                            {
                                this.state.chartSelector === -1 ? <StackItem grow>
                                    <DateTimePicker
                                        DateProps={{
                                            placeholder: "Дата окончания",
                                            allowTextInput: false,
                                            ariaLabel: 'Stop date',
                                            strings: defaultDatePickerStrings
                                        }}
                                        onChange={(dt) => {
                                            this.setState({
                                                to: Math.trunc(dt.getTime() / 1000)
                                            })
                                        }}
                                    />
                                </StackItem> : ""
                            }
                            {
                                this.state.chartSelector === -1 ? <StackItem>
                                    <PrimaryButton
                                        text="Показать"
                                        onClick={()=>{
                                            retrieveData(this.state.from, this.state.to)
                                        }}
                                    />
                                </StackItem> : ""
                            }

                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </StackItem>
        </Stack>
    }
}
