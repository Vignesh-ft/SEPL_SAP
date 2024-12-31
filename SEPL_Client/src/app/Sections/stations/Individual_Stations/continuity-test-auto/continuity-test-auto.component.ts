import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-continuity-test-auto',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './continuity-test-auto.component.html',
  styleUrl: './continuity-test-auto.component.scss'
})
export class ContinuityTestAutoComponent {
  title:any = "CONTINUITY TEST AUTO"
  endPoint = "continuity_test_auto"

  hourlyBody:any = {date: "2024-08-19"}
  dayBody:any = {fromDate: '2024-08-15', toDate: '2024-08-24'}
  shiftBody:any = {date: "2024-08-19"}
  monthBody:any = {fromMonth: 7, fromYear: 2024, toMonth: 9, toYear: 2024 }

  postData = {
    hour: this.hourlyBody,
    day: this.dayBody,
    shift: this.shiftBody,
    month: this.monthBody
  }
}
