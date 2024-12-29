import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChartsTemplateComponent } from "../../Components/charts-template/charts-template.component";
import { StampingStationAComponent } from "./Individual_Stations/stamping-station-a/stamping-station-a.component";

@Component({
  selector: 'app-stations',
  standalone: true,
  imports: [CommonModule, ChartsTemplateComponent, StampingStationAComponent],
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
      name:"VARNISH STATOR ASSEMBLY",
      isEnable: true,
      isDropDown: false,
      ddOptions: []
    },
    {
      order:5,
      isOpen:false,
      name:"FINAL ASSEMBLY",
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
