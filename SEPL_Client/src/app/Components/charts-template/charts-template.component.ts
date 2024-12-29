import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { ChartComponent } from "../chart/chart.component";
import { ChartAPIService } from '../../Services/chart-api.service';
import { interval, Subscription } from 'rxjs';


@Component({
  selector: 'app-charts-template',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './charts-template.component.html',
  styleUrl: './charts-template.component.scss'
})
export class ChartsTemplateComponent implements OnInit {

  @Input() templateTitle:string = ""
  // @Input() hourlyData:any
  // @Input() dayWiseData:any
  // @Input() shiftWiseData:any
  // @Input() monthWiseData:any

  private intervalSubscription: Subscription | null = null;

  dataCount:number = 12

  hourLabel:any = []
  hourData:any = []

  dayLabel:any = []
  dayData:any = []

  shiftLabel:any = []
  shiftData:any = []

  monthLabel:any = []
  monthData:any = []

  constructor(private sw: ChartAPIService){}

  isHourlyReport:boolean = true
  isDayWiseReport:boolean = true
  isShiftWiseReport:boolean = true
  isMonthWiseReport:boolean = true
  fourGrid:boolean = true

  chartRoute:any = [
    {
      order:0,
      tag: "hour",
      name:"HOURLY",
      isOpen:false,
    },
    {
      order:1,
      tag:"shift",
      name:"SHIFT WISE",
      isOpen:false,
    },
    {
      order:2,
      tag:"day",
      name:"DAY WISE",
      isOpen:false,
    },
    {
      order:3,
      tag:"month",
      name:"MONTH WISE",
      isOpen:false,
    },
  ]


  changeChart(order:any) {
    this.chartRoute.map((route:any)=> {
      route.isOpen = false
    })
    if(order === 5) {
      this.isHourlyReport = true
      this.isDayWiseReport = true
      this.isShiftWiseReport = true
      this.isMonthWiseReport = true
      this.fourGrid = true
      this.dataCount = 12
      return
    }
    this.chartRoute[order].isOpen = true
    let tag = this.chartRoute[order].tag

    if(tag === "hour") {
      this.dataCount = 20
      this.fourGrid = false
      this.isHourlyReport = true
      this.isDayWiseReport = false
      this.isShiftWiseReport = false
      this.isMonthWiseReport = false
    }

    else if(tag === "day") {
      this.dataCount = 20
      this.fourGrid = false
      this.isHourlyReport = false
      this.isDayWiseReport = true
      this.isShiftWiseReport = false
      this.isMonthWiseReport = false
    }

    else if(tag === "shift") {
      this.dataCount = 20
      this.fourGrid = false
      this.isHourlyReport = false
      this.isDayWiseReport = false
      this.isShiftWiseReport = true
      this.isMonthWiseReport = false
    }

    else if(tag === "month") {
      this.dataCount = 20
      this.fourGrid = false
      this.isHourlyReport = false
      this.isDayWiseReport = false
      this.isShiftWiseReport = false
      this.isMonthWiseReport = true
    }


  }

  ngOnInit(): void {
    this.getData()
  }

  getData() {
    // Need to add header
    this.intervalSubscription = interval(1000).subscribe(() => {
      this.sw.fetchChartData('chart-data').subscribe((data:any)=> {
        if(this.hourLabel.length > this.dataCount) {
          this.hourLabel.shift()
          this.hourData.shift()
        }
        this.hourLabel.push(data.time)
        this.hourData.push(data.value)
        // console.log("Hour",data);


      })

      this.sw.fetchChartData('chart-data').subscribe((data:any)=> {
        if(this.shiftLabel.length > this.dataCount) {
          this.dayLabel.shift()
          this.dayData.shift()
        }

        this.dayLabel.push(data.time)
        this.dayData.push(data.value)
        // console.log("Day",data);
      })

      this.sw.fetchChartData('chart-data').subscribe((data:any)=> {
        if(this.shiftLabel.length > this.dataCount) {
          this.shiftLabel.shift()
          this.shiftData.shift()
        }

        this.shiftLabel.push(data.time)
        this.shiftData.push(data.value)
        // console.log("Shift",data);
      })

      this.sw.fetchChartData('chart-data').subscribe((data:any)=> {
        if(this.monthLabel.length > this.dataCount) {
          this.monthLabel.shift()
          this.monthData.shift()
        }

        this.monthLabel.push(data.time)
        this.monthData.push(data.value)
        // console.log("Month",data);
      })
    })

  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    if(this.intervalSubscription) {
      this.intervalSubscription.unsubscribe()
    }
  }


}
