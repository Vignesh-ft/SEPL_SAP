import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-time-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-viewer.component.html',
  styleUrls: ['./time-viewer.component.scss']
})
export class TimeViewerComponent implements OnInit, OnDestroy {
  currentTime: string = '';
  currentDate: string = '';
  currentDay: string = '';
  currentYear:string = ''
  private intervalId: any;

  // List of months (adjusted index to match JavaScript's getMonth() method)
  months: any = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  ngOnInit(): void {
    this.updateTime();
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000); // Update every second
  }

  ngOnDestroy(): void {
    // Clean up the interval when the component is destroyed to avoid memory leaks
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  updateTime(): void {
    const now = new Date();

    // Get current time in HH:MM:SS format
    const hours = now.getHours();
    const minutes = now.getMinutes();
    this.currentTime = `${this.padTime(hours)}:${this.padTime(minutes)}`;

    // Get current date components (MM, YYYY, DD) using Date methods
    const month = now.getMonth(); // getMonth() returns 0-11 (January = 0)
    const day = now.getDate();
    const year = now.getFullYear();

    // Format the date in MM-Month-YYYY format
    this.currentDate = `${day}-${this.months[month]}`;
    this.currentYear = `${year}`

    // Get current day of the week
    this.currentDay = now.toLocaleString('en-US', { weekday: 'long' });
  }

  padTime(time: number): string {
    return time < 10 ? `0${time}` : `${time}`;
  }
}
