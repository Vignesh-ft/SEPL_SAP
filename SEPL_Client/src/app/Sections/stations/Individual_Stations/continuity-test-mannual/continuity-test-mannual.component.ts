import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-continuity-test-mannual',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './continuity-test-mannual.component.html',
  styleUrl: './continuity-test-mannual.component.scss'
})
export class ContinuityTestMannualComponent {
  title:any = "CONTINUITY TEST MANNUAL"
  endPoint = "continuity_test_mannual"

  hourlyBody:any = {date: "2024-08-19"}
  dayBody:any = {fromDate: '2024-08-15', toDate: '2024-08-24'}
  shiftBody:any = {date: "2024-08-15"}
  monthBody:any = {fromMonth: 7, fromYear: 2024, toMonth: 9, toYear: 2024 }

  postData = {
    hour: this.hourlyBody,
    day: this.dayBody,
    shift: this.shiftBody,
    month: this.monthBody
  }
}
