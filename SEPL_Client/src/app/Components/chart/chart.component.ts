import { Component, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { interval, Subscription } from 'rxjs';
import { ChartAPIService } from '../../Services/chart-api.service';
import { chartColors } from '../../../assets/colors/chartColor';

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
  @Input() legend:any
  @Input() showValue:any
  @Input() type:any | "line"

  rotorSum:any = []
  statorSum:any = []

  private intervalSubscription: Subscription | null = null;
  // chartData: any = [[], []];
  data: any;
  options: any;
  colors:any

  constructor(private sw: ChartAPIService) {}

  ngOnInit(): void {
    // console.log(this.value, this.label);

    if(this.lineColors === "hour"){
      this.colors = chartColors.hourReport
    }
    else if(this.lineColors === "day") {
      this.colors = chartColors.dayReport
    }
    else if (this.lineColors === "shift") {
      this.colors = chartColors.shiftReport
    }
    else if (this.lineColors === "month") {
      this.colors = chartColors.monthReport
    }

    this.updateChart()
    // this.distributeValue(this.value)
    this.initializeChart();

  }

  ngAfterViewInit(): void {
    this.updateChart()
    this.intervalSubscription = interval(1000).subscribe(() => {
        this.updateChart();
        this.data.labels = this.label
        this.data.datasets[0].data = this.value[0]
        this.data.datasets[1].data = this.value[1]

        // console.log("Chart js", this.value);

      });
  }


  initializeChart(): void {
    this.data = {
      labels: [],
      datasets: [
        {
          label: "Rotor Count",
          data: [],
          fill: false,
          borderColor: this.colors[0],
          backgroundColor: this.colors[0],
          tension: 0.4
        },
        {
          label: "Stator Count",
          data: [],
          fill: false,
          borderColor: this.colors[1],
          backgroundColor: this.colors[1],
          tension: 0.4
        },
      ]
    };

    this.options = {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: this.legend, // Disable legend correctly in Chart.js v4
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

    this.updateChart()
  }



  updateChart(): void {
    let interVal = interval(1000).subscribe(()=> {

      if(this.primeChart && this.primeChart.chart) {
        // console.log("chart Updated");
        this.primeChart.chart.update()
      }
        if (this.label.length > this.showValue) {
          console.log("Shifted")
          this.label.shift();
          this.rotorSum.shift();
          this.statorSum.shift()
        }
    })
  }

}
