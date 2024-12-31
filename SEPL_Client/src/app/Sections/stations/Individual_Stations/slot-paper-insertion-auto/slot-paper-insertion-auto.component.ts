import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-slot-paper-insertion-auto',
  standalone: true,
  imports: [ChartsTemplateComponent ],
  templateUrl: './slot-paper-insertion-auto.component.html',
  styleUrl: './slot-paper-insertion-auto.component.scss'
})
export class SlotPaperInsertionAutoComponent {
  title:any = "SLOT PAPER INSERTION AUTO"
  endPoint = "slot_paper_insertion_auto"

  hourlyBody:any = {date: "2024-08-14"}
  dayBody:any = {fromDate: '2024-08-05', toDate: '2024-08-14'}
  shiftBody:any = {date: "2024-08-14"}
  monthBody:any = {fromMonth: 7, fromYear: 2024, toMonth: 9, toYear: 2024 }

  postData = {
    hour: this.hourlyBody,
    day: this.dayBody,
    shift: this.shiftBody,
    month: this.monthBody
  }
}
