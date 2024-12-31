import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { ChartComponent } from "../chart/chart.component";
import { ChartAPIService } from '../../Services/chart-api.service';
import { interval, Subscription } from 'rxjs';
import { FilterService } from '../../Services/filter.service';
import { LoaderComponent } from "../loader/loader.component";


@Component({
  selector: 'app-charts-template',
  standalone: true,
  imports: [CommonModule, ChartComponent, LoaderComponent],
  templateUrl: './charts-template.component.html',
  styleUrl: './charts-template.component.scss'
})
export class ChartsTemplateComponent implements OnInit {

  @Input() templateTitle:string = ""
  @Input() endPoint:any
  @Input() refreshInterval:any
  @Input() postData:any
  @Input() stationName:any

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

  toolTipLabel:any = []

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

  // hourlyBody:any = {date: "2024-07-26"}
  // dayBody:any = {fromDate: '2024-07-22', toDate: '2024-08-02'}
  // shiftBody:any = {date: "2024-07-22"}
  // monthBody:any = {fromMonth: 7, fromYear: 2024, toMonth: 9, toYear: 2024 }

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

  loader:boolean = true
  counter:number = 0


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

    // console.log("Loader State: ", this.counter, this.loader);

    this.sw.fetchChartData(this.stationName,`${this.endPoint}/hourly`, this.postData.hour).subscribe((response:any)=> {
      // console.log("Hourly Data",response)
      if(response) {
        this.counter+=1
        console.log(`${response.station} Hourly Data Recieved`);
      }

      if(this.counter == 4) {
        this.loader = false
        // console.log("Loader State: ", this.counter, this.loader);
      }

      this.hourlyReport(response)
    })

    this.sw.fetchChartData(this.stationName, `${this.endPoint}/dayWise`, this.postData.day).subscribe((response:any)=> {
      // console.log("Day Data",response)
      if(response) {
        this.counter+=1
        console.log(`${response.station} Day Data Recieved`);
      }

      if(this.counter == 4) {
        this.loader = false
        // console.log("Loader State: ", this.counter, this.loader);
      }

      this.dailyReport(response)
    })

    this.sw.fetchChartData(this.stationName,`${this.endPoint}/shiftWise`, this.postData.shift).subscribe((response:any)=> {
      // console.log("Shift Data",response)
      if(response) {
        this.counter+=1
        console.log(`${response.station} Shift Data Recieved`);
      }

      if(this.counter == 4) {
        this.loader = false
        // console.log("Loader State: ", this.counter, this.loader);
      }

      this.shiftReport(response)

    })

    this.sw.fetchChartData(this.stationName, `${this.endPoint}/monthWise`, this.postData.month).subscribe((response:any)=> {
      // console.log("Month Data",response)
      if(response) {
        this.counter+=1
        console.log(`${response.station} Month Data Recieved`);
      }

      if(this.counter == 4) {
        this.loader = false
        // console.log("Loader State: ", this.counter, this.loader);
      }

      this.monthReport(response)
    })

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



    this.intervalSubscription = interval(this.refreshInterval).subscribe(() => {

      // console.log("Updated");


      this.sw.fetchChartData(this.stationName, `${this.endPoint}/hourly`, this.postData.hour).subscribe((response:any)=> {
        // console.log("Hourly Data",response)
        this.hourlyReport(response)
      })

      this.sw.fetchChartData(this.stationName, `${this.endPoint}/dayWise`, this.postData.day).subscribe((response:any)=> {
        // console.log("Day Data",response)
        this.dailyReport(response)
      })

      this.sw.fetchChartData(this.stationName, `${this.endPoint}/shiftWise`, this.postData.shift).subscribe((response:any)=> {
        // console.log("Shift Data",response)
        this.shiftReport(response)

      })

      this.sw.fetchChartData(this.stationName, `${this.endPoint}/monthWise`, this.postData.month).subscribe((response:any)=> {
        // console.log("Month Data",response)
        this.monthReport(response)

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

      if(data.rotor_sum !== undefined && data.stator_sum !== undefined) {
        this.toolTipLabel = ["Rotor Count","Stator Count"]
        // console.log("Rotor Sum", "Stator Sum");
        this.hourData1.push(data.rotor_sum);
        this.hourData2.push(data.stator_sum);
      }

      if(data.ok_sum !== undefined) {
        // console.log("OK SUM");
        this.toolTipLabel.push("Ok Count")
        this.hourData1.push(data.ok_sum);
      }

      if(data.ng_sum !== undefined) {
        // console.log("NG SUM");
        this.toolTipLabel.push("Ng Count")
        this.hourData2.push(data.ng_sum);
      }

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

      if(data.rotor_sum !== undefined && data.stator_sum !== undefined) {
        this.toolTipLabel = ["Rotor Count","Stator Count"]
        this.dayData1.push(data.rotor_sum);
        this.dayData2.push(data.stator_sum);
      }

      if(data.ok_sum !== undefined) {
        this.toolTipLabel.push("Ok Count")
        this.dayData1.push(data.ok_sum);
      }

      if(data.ng_sum !== undefined) {
        this.toolTipLabel.push("Ng Count")
        this.dayData2.push(data.ng_sum);
      }

    })

    this.dayData = [this.dayData1, this.dayData2]
    // console.log(this.dayData);
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
    // console.log(res);

    this.shiftData1 = []
    this.shiftData2 = []

    res.shiftSums.map((data:any)=> {

      if(data.rotor_sum !== undefined && data.stator_sum !== undefined) {
        this.toolTipLabel = ["Rotor Count","Stator Count"]
        this.shiftData1.push(data.rotor_sum);
        this.shiftData2.push(data.stator_sum);
      }

      if(data.ok_sum !== undefined) {
        this.toolTipLabel.push("Ok Count")
        this.shiftData1.push(data.ok_sum);
      }

      if(data.ng_sum !== undefined) {
        this.toolTipLabel.push("Ng Count")
        this.shiftData2.push(data.ng_sum);
      }

    })

    this.shiftData = [this.shiftData1, this.shiftData2]
    // console.log(this.shiftData);
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

  monthReport(res:any) {
    this.monthLabel = res.monthLabels
    // console.log(res);

    this.monthData1 = []
    this.monthData2 = []

    res.monthSums.map((data:any)=> {
      if(data.rotor_sum !== undefined && data.stator_sum !== undefined) {
        this.toolTipLabel = ["Rotor Count","Stator Count"]
        this.monthData1.push(data.rotor_sum);
        this.monthData2.push(data.stator_sum);
      }

      if(data.ok_sum !== undefined) {
        this.toolTipLabel.push("Ok Count")
        this.monthData1.push(data.ok_sum);
      }

      if(data.ng_sum !== undefined) {
        this.toolTipLabel.push("Ng Count")
        this.monthData2.push(data.ng_sum);
      }
    })

    this.monthData = [this.monthData1, this.monthData2]
    // console.log(this.monthData);
  }









  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    if(this.intervalSubscription) {
      this.intervalSubscription.unsubscribe()
    }
  }


}
