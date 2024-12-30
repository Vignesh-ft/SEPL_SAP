import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { ChartComponent } from "../chart/chart.component";
import { ChartAPIService } from '../../Services/chart-api.service';
import { interval, Subscription } from 'rxjs';
import { FilterService } from '../../Services/filter.service';


@Component({
  selector: 'app-charts-template',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './charts-template.component.html',
  styleUrl: './charts-template.component.scss'
})
export class ChartsTemplateComponent implements OnInit {

  @Input() templateTitle:string = ""
  @Input() endPoint:any
  // @Input() dayWiseData:any
  // @Input() shiftWiseData:any
  // @Input() monthWiseData:any

  private intervalSubscription: Subscription | null = null;


  dataCount:number = 12

  hourLabel:any = []
  hourData:any = []
  hourData1:any = []
  hourData2:any = []

  dayLabel:any = []
  dayData:any = []
  dayData1:any = []
  dayData2:any = []

  shiftLabel:any = []
  shiftData:any = []
  shiftData1:any = []
  shiftData2:any = []

  monthLabel:any = []
  monthData:any = []
  monthData1:any = []
  monthData2:any = []

  constructor(private filterService: FilterService, private sw: ChartAPIService,){}

  isHourlyReport:boolean = true
  isDayWiseReport:boolean = true
  isShiftWiseReport:boolean = true
  isMonthWiseReport:boolean = true
  fourGrid:boolean = true

  hourReportData:any
  dayReportData:any
  shiftReportData:any
  monthReportData:any

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


  // getData() {
  //   // Need to add header
  //   this.intervalSubscription = interval(1000).subscribe(() => {
  //     this.sw.fetchChartData(this.endPoint).subscribe((data:any)=> {
  //       // console.log(data);

  //       this.hourlyReport(data)
  //       this.dailyReport(data)
  //       this.shiftReport(data)
  //       this.monthReport(data)
  //     })
  //   })

  // }

  getData() {
    // Need to add header

    const date = new Date();
    const currDate = date.toISOString().split('T')[0]; // Extract the date portion

    // Calculate the date 10 days earlier
    const tenDaysAgo = new Date(date);
    tenDaysAgo.setDate(date.getDate() - 10);
    const dayEndPointDate = tenDaysAgo.toISOString().split('T')[0];

    // Calculate the date 5 months earlier
    const sixMonthsAgo = new Date(date);
    sixMonthsAgo.setMonth(date.getMonth() - 6);
    const monthEndPointDate = sixMonthsAgo.toISOString().split('T')[0];

    // Calculate the date 5 days earlier
    const fiveDaysAgo = new Date(date);
    fiveDaysAgo.setDate(date.getDate() - 5);
    const shiftEndPointDate = fiveDaysAgo.toISOString().split('T')[0];


    // const hourlyBody = {date:String(currDate)}
    // const dayBody = {fromDate: String(dayEndPointDate), toDate: String(currDate)}
    // const shiftBody = [String(shiftEndPointDate), String(currDate)]
    // const monthBody = [String(monthEndPointDate), String(currDate)]

    const hourlyBody = {date: "2024-07-26"}
    const dayBody = {fromDate: '2024-07-22', toDate: '2024-08-02'}
    const shiftBody = {date: "2024-07-22"}

    this.intervalSubscription = interval(1000).subscribe(() => {

      this.sw.fetchChartData('stamping_station_a/hourly', hourlyBody).subscribe((response:any)=> {
        // console.log(response)
        this.hourlyReport(response)
      })

      this.sw.fetchChartData('stamping_station_a/dayWise', dayBody).subscribe((response:any)=> {
        // console.log(response)
        this.dailyReport(response)
      })

      this.sw.fetchChartData('stamping_station_a/shiftWise', shiftBody).subscribe((response:any)=> {
        // console.log(response)
        this.shiftReport(response)

      })

    })

  }

  // hourlyReport(data:any) {
  //   this.hourReportData = this.filterService.hourFilter(data)
  //   // console.log(this.hourReportData)
  //   this.hourLabel = this.hourReportData.hourlyLabels
  //   this.hourData1 = []
  //   this.hourData2 = []
  //   this.hourReportData.hourlySums.map((data:any) => {
  //     this.hourData1.push(data.rotor_sum)
  //     this.hourData2.push(data.stator_sum)
  //   })

  //   this.hourData = [this.hourData1, this.hourData2]
  //   // console.log("Updated Hour", this.hourData);
  // }

  hourlyReport(res:any){
    this.hourLabel = res.hourlyLabels
    this.hourData1 = []
    this.hourData2 = []

    res.hourlySums.map((data:any)=> {
      this.hourData1.push(data.rotor_sum);
      this.hourData2.push(data.stator_sum);
    })

    this.hourData = [this.hourData1, this.hourData2]
    // console.log(this.hourData);

  }

  // dailyReport(data:any) {
  //   this.dayReportData = this.filterService.dayFilter(data)
  //   // console.log(this.hourReportData)
  //   this.dayLabel = this.dayReportData.dailyLabels
  //   this.dayData1 = []
  //   this.dayData2 = []
  //   this.dayReportData.dailySums.map((data:any) => {
  //     this.dayData1.push(data.rotor_sum)
  //     this.dayData2.push(data.stator_sum)
  //   })

  //   this.dayData = [this.dayData1, this.dayData2]
  //   // console.log("Updated Day", this.dayData );
  // }

  dailyReport(res:any) {
    this.dayLabel = res.dailyLabels
    this.dayData1 = []
    this.dayData2 = []

    res.dailyAggregates.map((data:any)=> {
      this.dayData1.push(data.rotor_sum);
      this.dayData2.push(data.stator_sum);
    })

    this.dayData = [this.dayData1, this.dayData2]
    console.log(this.dayData);
  }

  // shiftReport(data:any) {
  //   this.shiftReportData = this.filterService.shiftFilter(data)
  //   // console.log(this.hourReportData)
  //   this.shiftLabel = this.shiftReportData.shiftLabels
  //   this.shiftData1 = []
  //   this.shiftData2 = []
  //   this.shiftReportData.shiftSums.map((data:any) => {
  //     this.shiftData1.push(data.rotor_sum)
  //     this.shiftData2.push(data.stator_sum)
  //   })

  //   this.shiftData = [this.shiftData1, this.shiftData2]
  //   // console.log("Updated shift", this.shiftData );
  // }

  shiftReport(res:any) {
    this.shiftLabel = res.shiftLabels
    this.shiftData1 = []
    this.shiftData2 = []

    res.shiftSums.map((data:any)=> {
      this.shiftData1.push(data.rotor_sum);
      this.shiftData2.push(data.stator_sum);
    })

    this.shiftData = [this.shiftData1, this.shiftData2]
    console.log(this.shiftData);
  }

  // monthReport(data:any) {
  //   this.monthReportData = this.filterService.monthFilter(data)
  //   // console.log(this.hourReportData)
  //   this.monthLabel = this.monthReportData.monthlyLabels
  //   this.monthData1 = []
  //   this.monthData2 = []
  //   this.monthReportData.monthlySums.map((data:any) => {
  //     this.monthData1.push(data.rotor_sum)
  //     this.monthData2.push(data.stator_sum)
  //   })

  //   this.monthData = [this.monthData1, this.monthData2]
  //   // console.log("Updated month", this.monthData );
  // }









  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    if(this.intervalSubscription) {
      this.intervalSubscription.unsubscribe()
    }
  }


}
