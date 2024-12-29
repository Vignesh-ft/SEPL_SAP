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
}
