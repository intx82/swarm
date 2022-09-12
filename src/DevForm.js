import * as React from "react";
import { Pivot, PivotItem } from "@fluentui/react";
import { Window } from "./Window";
import { DevMainCtrls } from "./DevMainCtrls";
import { DevFw } from "./DevFw";
import { DevChart } from "./DevCharts";
import { DevUsers } from "./DevUsers";

/**
 * Основная форма устройства
 *
 * @param {*} props
 * @returns
 */
export const DevForm = (props) => {

  const devRegs = props.devState !== null ? props.devState['regs'] : null
  const devType = devRegs !== null ? devRegs[15] : 0
  const devStatus = 'status' in props.devState ? props.devState.status : 0
  const devReadOnly = props.devState['auth'] & !(!!props.user.hash)
  const fwList = props.fwList ? props.fwList : {}
  const devDesc = props.devDesc.hasOwnProperty(devType) ? props.devDesc[devType] : props.devDesc['unknown']

  const onLinkClick = (pivotItem) => {
    if ('onClick' in pivotItem.props && typeof pivotItem.props.onClick === 'function') {
      pivotItem.props.onClick()
    }
  }

  const getVersion = () => {
    if (!devReadOnly && typeof props.getVersion === 'function' && !props.devState.version) {
      props.getVersion(props.devState)
    }
  }

  return <Window title={devDesc.name} isOpen={props.devState !== null} onCancel={props.onCancel}>
    <Pivot aria-label="Device menu" onLinkClick={onLinkClick} linkFormat="tabs">
      <PivotItem headerText="Основное" itemCount={devStatus} itemIcon="AllApps">
        {devReadOnly ? <p>Для управления устройством необходима авторизация</p> : ''}
        {devDesc.regs.map((item, index) => {
          return (
            <div key={`item ${index}`}>
              {devRegs ? DevMainCtrls(item, devReadOnly, devRegs, props.onChangeReg) : " "}
            </div>
          );
        })}
      </PivotItem>
      {
        devDesc.tabs.users ?
          <PivotItem headerText="Пользователи" itemIcon="FabricUserFolder">
            <DevUsers devState={props.devState} user={props.user} />
          </PivotItem> : ""
      }
      {
        devDesc.tabs.events ?
          <PivotItem headerText="Графики" itemI con="Diagnostic">
            <DevChart
              devState={props.devState}
              user={props.user}
              clearStore={props.clearStore}
            />
          </PivotItem> : ""
      }
      {
        devDesc.tabs.fw && devType in fwList && fwList[devType].length > 0 ?
          <PivotItem headerText="Обновление ПО" itemIcon="FlameSolid" onClick={getVersion}>
            {devRegs ? <DevFw
              devDesc={devDesc}
              devState={props.devState}
              fwList={fwList}
              user={props.user}
              onFwUpd={props.onFwUpd}
              getVersion={() => getVersion()}
            /> : ""}
          </PivotItem> : ""
      }
    </Pivot>

  </Window>
};
