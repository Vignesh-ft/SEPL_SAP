import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-stamping-station-b',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './stamping-station-b.component.html',
  styleUrl: './stamping-station-b.component.scss'
})
export class StampingStationBComponent {
  title:any = "STAMPING STATION B"
  endPoint:string = "stamping_station_b"
}
