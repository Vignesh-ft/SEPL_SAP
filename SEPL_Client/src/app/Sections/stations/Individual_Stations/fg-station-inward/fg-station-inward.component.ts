import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-fg-station-inward',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './fg-station-inward.component.html',
  styleUrl: './fg-station-inward.component.scss'
})
export class FgStationInwardComponent {


  title:any = "FG STATION - INWARD"
  endPoint:string = "fg_stocktable_inward"
  //use the below code if date to be hard coded
  // hourlyBody:any = {date: "2024-07-26"}
  // dayBody:any = {fromDate: '2024-07-24', toDate: '2024-08-02'}
  // shiftBody:any = {date: "2024-07-22"}
  // monthBody:any = {fromMonth: 7, fromYear: 2024, toMonth: 9, toYear: 2024 }

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
