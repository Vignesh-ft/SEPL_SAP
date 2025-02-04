import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StampingStationAComponent } from "./Individual_Stations/stamping-station-a/stamping-station-a.component";
import { StampingStationBComponent } from "./Individual_Stations/stamping-station-b/stamping-station-b.component";
import { SlotPaperInsertionAutoComponent } from "./Individual_Stations/slot-paper-insertion-auto/slot-paper-insertion-auto.component";
import { SlotPaperInsertionMannualComponent } from "./Individual_Stations/slot-paper-insertion-mannual/slot-paper-insertion-mannual.component";
import { ContinuityTestAutoComponent } from "./Individual_Stations/continuity-test-auto/continuity-test-auto.component";
import { ContinuityTestMannualComponent } from "./Individual_Stations/continuity-test-mannual/continuity-test-mannual.component";
import { SpTestAutoComponent } from "./Individual_Stations/sp-test-auto/sp-test-auto.component";
import { SpTestMannualComponent } from "./Individual_Stations/sp-test-mannual/sp-test-mannual.component";
import { VarnishStatorAssemblyComponent } from "./Individual_Stations/varnish-stator-assembly/varnish-stator-assembly.component";
import { FgStationComponent } from "./Individual_Stations/fg-station/fg-station.component";
import {RotorShaftAssemblyComponent} from "./Individual_Stations/rotor-shaft-assembly/rotor-shaft-assembly.component";
import { PdiStationComponent } from './Individual_Stations/pdi-station/pdi-station.component';
import { FinalAssemblyStationComponent } from './Individual_Stations/final-assembly-station/final-assembly-station.component';

@Component({
  selector: 'app-stations',
  standalone: true,
  imports: [CommonModule, StampingStationAComponent, StampingStationBComponent, SlotPaperInsertionAutoComponent, SlotPaperInsertionMannualComponent, ContinuityTestAutoComponent, ContinuityTestMannualComponent, SpTestAutoComponent, SpTestMannualComponent, VarnishStatorAssemblyComponent, FgStationComponent, RotorShaftAssemblyComponent, PdiStationComponent, FinalAssemblyStationComponent],
  templateUrl: './stations.component.html',
  styleUrl: './stations.component.scss'
})
export class StationsComponent {
  options:any = [
    {
      order:0,
      isOpen:true,
      name:"STAMPING STATION",
      isEnable: true,
      isDropDown: true,
      ddOptions: [
        {
          order: 0,
          isOpen: true,
          name:"STAMPING STATION A"
        },
        {
          order: 1,
          isOpen: false,
          name:"STAMPING STATION B"
        }
      ]
    },
    {
      order:1,
      isOpen:false,
      name:"SLOT PAPER INSERTION",
      isEnable: true,
      isDropDown: true,
      isDDOpen: false,
      ddOptions: [
        {
          order: 0,
          isOpen: true,
          name:"AUTO"
        },
        {
          order: 1,
          isOpen: false,
          name:"MANNUAL"
        }
      ]
    },
    {
      order:2,
      isOpen:false,
      name:"CONTINUITY TEST",
      isEnable: true,
      isDropDown: true,
      ddOptions: [
        {
          order: 0,
          isOpen: true,
          name:"AUTO"
        },
        {
          order: 1,
          isOpen: false,
          name:"MANNUAL"
        }
      ]
    },
    {
      order:3,
      isOpen:false,
      name:"SP TEST",
      isEnable: true,
      isDropDown: true,
      ddOptions: [
        {
          order: 0,
          isOpen: true,
          name:"AUTO"
        },
        {
          order: 1,
          isOpen: false,
          name:"MANNUAL"
        }
      ]
    },
    {
      order:4,
      isOpen:false,
      name:"FG STATION",
      isEnable: true,
      isDropDown: false,
      ddOptions: []
    },
    {
      order:5,
      isOpen:false,
      name:"VARNISH STATOR ASSEMBLY",
      isEnable: true,
      isDropDown: false,
      ddOptions: []
    },
    {
      order:6,
      isOpen:false,
      name:"ROTOR SHAFT ASSEMBLY",
      isEnable: true,
      isDropDown: false,
      ddOptions: []
    },
    {
      order:7,
      isOpen:false,
      name:"PDI STATION",
      isEnable: true,
      isDropDown: false,
      ddOptions: []
    },
    {
      order:8,
      isOpen:false,
      name:"FINAL ASSEMBLY STATION",
      isEnable: true,
      isDropDown: false,
      ddOptions: []
    },
  ]
  changeMain(order:any) {
    this.options.map((opt:any) => {
      opt.isOpen = false
    })

    this.options[order].isOpen = true
  }
  changeSubMain(mainOrder:any, subOrder:any) {
    this.options[mainOrder].ddOptions.map((opt:any) => {
      opt.isOpen = false
    })
    this.options[mainOrder].ddOptions[subOrder].isOpen = true
  }
}
