import { Component } from '@angular/core';
import { ChartsTemplateComponent } from "../../../../Components/charts-template/charts-template.component";

@Component({
  selector: 'app-stamping-station-a',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './stamping-station-a.component.html',
  styleUrl: './stamping-station-a.component.scss'
})
export class StampingStationAComponent {
  title:any = "STAMPING STATION A"
  endPoint:string = "stamping_station_a"

  hourlyBody:any = {date: "2024-07-26"}
  dayBody:any = {fromDate: '2024-07-24', toDate: '2024-08-02'}
  shiftBody:any = {date: "2024-07-22"}
  monthBody:any = {fromMonth: 7, fromYear: 2024, toMonth: 9, toYear: 2024 }

  postData = {
    hour: this.hourlyBody,
    day: this.dayBody,
    shift: this.shiftBody,
    month: this.monthBody
  }
}
