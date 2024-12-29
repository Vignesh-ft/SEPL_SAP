import { Component, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { interval, Subscription } from 'rxjs';
import { ChartAPIService } from '../../Services/chart-api.service';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnInit {
  @ViewChild('primeChart') primeChart: any; // Reference to the PrimeNG chart
  @Input() title: string = '';
  @Input() endPoint: string = '';
  @Input() lineColors: string = '';
  @Input() refreshInterval:number = 1000
  @Input() label:any
  @Input() value:any

  private intervalSubscription: Subscription | null = null;
  chartData: any = [[], []];
  data: any;
  options: any;
  type:string = "line"

  constructor(private sw: ChartAPIService) {}

  ngOnInit(): void {
    this.initializeChart();
    this.updateChart()
  }

  // ngAfterViewInit(): void {
  //   this.intervalSubscription = interval(this.refreshInterval).subscribe(() => {
  //     this.sw.fetchChartData(this.endPoint).subscribe((chart: any) => {
  //       this.chartData[0].push(chart.time);
  //       this.chartData[1].push(chart.value);

  //       this.updateChart();

  //       if (this.chartData[0].length > 10) {
  //         // Keep only the last 10 points
  //         this.chartData[0].shift();
  //         this.chartData[1].shift();
  //       }
  //     });
  //   });

  // }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.updateChart()
  }

  initializeChart(): void {
    this.data = {
      labels: this.label,
      datasets: [
        {
          data: this.value,
          fill: false,
          borderColor: this.lineColors,
          tension: 0
        }
      ]
    };

    this.options = {
      responsive: true,
      plugins: {
        legend: {
          display: false, // Disable legend correctly in Chart.js v4
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#00000090', // Set color for x-axis labels
          },
          grid: {
            color: '#00000040', // Set grid line color
            borderDash: [5,5],
            drawBorder: true, // Ensure the axis line is drawn
            lineWidth: 0, // Set line width for the grid lines
          },
        },
        y: {
          border: {
            dash: [5,5]
          },
          ticks: {
            color: '#00000090', // Set color for y-axis labels
          },
          grid: {
            color: '#00000030', // Set grid line color
            lineWidth: 0.5, // Set line width for the grid lines
          },
        },
      },
    };
  }



  updateChart(): void {
    let interVal = interval(1000).subscribe(()=> {
      if(this.primeChart && this.primeChart.chart) {
        this.primeChart.chart.update()
      }

        // if (this.label.length > 15) {
        //   console.log("Shifted")
        //   this.label.shift();
        //   this.value.shift();
        // }
    })
  }

}
