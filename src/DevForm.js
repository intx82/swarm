import * as React from "react";
import { Pivot, PivotItem, Label } from "@fluentui/react";
import { Window } from "./Window";
import { DevMainCtrls } from "./DevMainCtrls";

/**
 * Основная форма устройства
 * 
 * @param {*} props 
 * @returns 
 */
export const DevForm = (props) => {
  const devReadOnly = props.readOnly

  const devType = props.isOpen ? props.regValues[15] : 0
  const devDesc = props.devDesc.hasOwnProperty(devType) ? props.devDesc[devType] : props.devDesc['unknown']
  return <Window title={devDesc.name} isOpen={props.isOpen} onCancel={props.onCancel}>
        
        <Pivot aria-label="Count and Icon Pivot Example">
        <PivotItem headerText="Основное" itemCount={props.status} itemIcon="AllApps">
          {devReadOnly ? <p>Для управления устройством необходима авторизация</p> : ''}
          {devDesc.regs.map((item, index) => {
            return (
              <div key={`item ${index}`}>
                {props.regValues ? DevMainCtrls(item, devReadOnly, props) : " "}
              </div>
            );
          })}
        </PivotItem>
        <PivotItem headerText="Пользователи" itemIcon="FabricUserFolder">
          <Label>Тут должен был быть список пользователей</Label>
        </PivotItem>
        <PivotItem headerText="Графики" itemIcon="Diagnostic">
          <Label>Графики...</Label>
        </PivotItem>
        <PivotItem headerText="Обновление ПО" itemIcon="FlameSolid">
          <Label>Обновлениие прошивки устройства</Label>
        </PivotItem>
      </Pivot>

  </Window>
};
