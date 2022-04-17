import * as React from "react";
import { Pivot, PivotItem, Label, ComboBox, PrimaryButton,Stack, StackItem } from "@fluentui/react";
import { Window } from "./Window";
import { DevMainCtrls } from "./DevMainCtrls";

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
  const updater = props.updater ? props.updater : {}
  const [ver, branch, commit] = props.devState.version ? props.devState.version.toString().split(';', 3) : [devReadOnly ? 'Для получение версии необходима авторизация' : 'Ошибка получения версии', '', '']
  const devDesc = props.devDesc.hasOwnProperty(devType) ? props.devDesc[devType] : props.devDesc['unknown']

  const onLinkClick = (pivotItem) => {
    if ('onClick' in pivotItem.props && typeof pivotItem.props.onClick === 'function') {
      pivotItem.props.onClick()
    }
  }

  const getVersion = () => {
    if (!devReadOnly && typeof props.getVersion === 'function') {
      props.getVersion(props.devState)
    }
  }

  return <Window title={devDesc.name} isOpen={props.devState !== null} onCancel={props.onCancel}>
    <Pivot aria-label="Device menu" onLinkClick={onLinkClick}>
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
            <Label>Тут должен был быть список пользователей</Label>
          </PivotItem> : ""
      }
      {
        devDesc.tabs.events ?
          <PivotItem headerText="Графики" itemIcon="Diagnostic">
            <Label>Графики...</Label>
          </PivotItem> : ""
      }
      {
        devDesc.tabs.fw && devType in updater && updater[devType].length > 0 ?
          <PivotItem headerText="Обновление ПО" itemIcon="FlameSolid" onClick={getVersion}>
            <Stack>
              <StackItem><Label>Текущая версия: <b>{ver} {branch} {commit}</b></Label></StackItem>

              {!devReadOnly ?
                <StackItem style={{marginBottom: '4pt'}}>
                  <ComboBox
                    label="Доступные версии ПО устройства:"
                    selectedKey={updater[devType][updater[devType].length - 1]['r']}
                    options={updater[devType].map((v, i) => {
                      return {
                        key: v['r'],
                        text: `${v['r']} ${v['b']} ${v['c']} Размер: ${Number.parseInt(v['s']) * 1024} кб`
                      }
                    })}
                  /></StackItem> : ''}
              {!devReadOnly ? <StackItem align="end"><PrimaryButton text="Записать" /></StackItem> : ''}
            </Stack>
          </PivotItem> : ""
      }
    </Pivot>

  </Window>
};
