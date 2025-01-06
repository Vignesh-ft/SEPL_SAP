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

 // Get current date
 currentDate: Date = new Date();

 // Generate date strings
 currentDateString: string = this.currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
 pastDateString: string = new Date(this.currentDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago

 // Month and year calculations
 currentMonth: number = this.currentDate.getMonth() + 1; // Add 1 to convert to 1-based month
 currentYear: number = this.currentDate.getFullYear();

 // Handle wraparound for months and years
 previousMonth: number = this.currentMonth - 2 > 0 ? this.currentMonth - 2 : 12 + (this.currentMonth - 2);
 previousYear: number = this.currentMonth - 2 > 0 ? this.currentYear : this.currentYear - 1;

 hourlyBody: any = { date: this.currentDateString };
 dayBody: any = { fromDate: this.pastDateString, toDate: this.currentDateString };
 shiftBody: any = { date: this.currentDateString };
 monthBody: any = {
   fromMonth: this.previousMonth,
   fromYear: this.previousYear,
   toMonth: this.currentMonth,
   toYear: this.currentYear
 };

postData = {
  hour: this.hourlyBody,
  day: this.dayBody,
  shift: this.shiftBody,
  month: this.monthBody
};
}
