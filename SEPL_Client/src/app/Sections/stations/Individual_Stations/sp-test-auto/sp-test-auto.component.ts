import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-sp-test-auto',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './sp-test-auto.component.html',
  styleUrl: './sp-test-auto.component.scss'
})
export class SpTestAutoComponent {
  title:any = "SP TEST AUTO"
  endPoint = "sp_test_auto"

  hourlyBody:any = {date: "2024-07-26"}
  dayBody:any = {fromDate: '2024-07-22', toDate: '2024-08-02'}
  shiftBody:any = {date: "2024-07-22"}
  monthBody:any = {fromMonth: 7, fromYear: 2024, toMonth: 9, toYear: 2024 }

  postData = {
    hour: this.hourlyBody,
    day: this.dayBody,
    shift: this.shiftBody,
    month: this.monthBody
  }
}
