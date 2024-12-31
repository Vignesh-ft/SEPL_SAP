import { ChartsTemplateComponent } from './../../../../Components/charts-template/charts-template.component';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sp-test-mannual',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './sp-test-mannual.component.html',
  styleUrl: './sp-test-mannual.component.scss'
})
export class SpTestMannualComponent {
  title:any = "SP TEST MANNUAL"
  endPoint = "sp_test_mannual"

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
