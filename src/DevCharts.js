

import * as React from "react";
import { Stack, StackItem, ComboBox } from "@fluentui/react";
import devDesc from "./devices.json";
import { Label } from "recharts";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';


function genRegsList(type) {
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
 * Форма для управления обновлением прошивки
 * @param {*} props
 * @returns
 */
export const DevChart = (props) => {
    const devRegs = props.devState !== null ? props.devState['regs'] : null
    const devType = devRegs !== null ? devRegs[15] : 0
    const devStore = props.devState['store']
    const options = genRegsList(devType)

    const [selectedReg, setSelectedReg] = React.useState(options.length === 0 ? 0 : options[0].key)

    /**
     * Преобразовывает в float
     * @param {number} inData
     * @returns
     */
    const toFloat = (inData) => {
        const bFloat = new Uint8Array([
            (inData >> 24) & 0xff,
            (inData >> 16) & 0xff,
            (inData >> 8) & 0xff,
            inData & 0xff,
        ]).buffer;
        var view = new DataView(bFloat);
        return view.getFloat32(0, false).toFixed(2)
    };

    const onChangeReg = (evt, val) => {
        console.log(evt, val)
        setSelectedReg(val.key)
    }

    if (options.length === 0) {
        return <Label>Нет регистров для отображения</Label>
    }

    //const regType = devDesc[devType]['regs'].filter(v => v.id === selectedReg)[0].type
    //const maxVal = 'maximum' in regType ? regType['maximum'] : 'dataMax'

    const data = Array.from({ length: 60 }, (v, k) => {
        const ts = devStore[selectedReg][0]['ts'] + (60000 * k)
        const val = devStore[selectedReg].filter((v) => v['ts'] <= ts && v['ts'] > (ts - 60000))
        let skip = devStore[selectedReg].filter((v) => v['ts'] <= ts)
        skip = skip.length > 0 ? skip[skip.length - 1] : undefined

        return {
            ts: `${String(new Date(ts).getHours()).padStart(2,0)}:${String(new Date(ts).getMinutes()).padStart(2,0)}`,
            v: val.length > 0 ? toFloat(val[0]['v']) : ts <= Date.now() ? toFloat(skip['v']) : undefined
        }
    })

    const maxVal = Math.max.apply(Math, data.filter(v=>v.v > 0).map(v => Number(v.v))) * (1 + Math.sqrt(5))/2

    return <Stack>
        <StackItem>
            <ComboBox
                defaultSelectedKey={options[0].key}
                label="Параметр"
                options={options}
                onChange={onChangeReg}
            />
        </StackItem>
        <StackItem>
            <LineChart width={560} height={300} data={data} margin={{ top: 10, right: 0, bottom: 5, left: 0 }} >
                <Line type="monotone" dataKey="v" stroke="#8884d8" />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="ts" />
                <YAxis type="number" domain={[0, maxVal]} scale="linear"/>
                <Tooltip />
            </LineChart>
        </StackItem>
    </Stack>
}